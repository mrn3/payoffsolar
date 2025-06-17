'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaCopy, FaSync } from 'react-icons/fa';
import { OrderWithContact } from '@/lib/models';
import { format } from 'date-fns';

interface BulkMergeOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrderIds: string[];
  onComplete: () => void;
}

interface OrderDuplicateGroup {
  id: string;
  orders: OrderWithContact[];
  matchType: string;
  similarityScore: number;
}

export default function BulkMergeOrdersModal({
  isOpen,
  onClose,
  selectedOrderIds,
  onComplete
}: BulkMergeOrdersModalProps) {
  const [step, setStep] = useState<'loading' | 'list' | 'merge' | 'merging'>('loading');
  const [duplicateGroups, setDuplicateGroups] = useState<OrderDuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<OrderDuplicateGroup | null>(null);
  const [primaryOrder, setPrimaryOrder] = useState<OrderWithContact | null>(null);
  const [duplicateOrder, setDuplicateOrder] = useState<OrderWithContact | null>(null);
  const [mergedData, setMergedData] = useState<Partial<OrderWithContact>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      findDuplicatesInSelection();
    }
  }, [isOpen, selectedOrderIds]);

  const findDuplicatesInSelection = async () => {
    setStep('loading');
    setError(null);

    try {
      // First, try to find actual duplicates
      const response = await fetch('/api/orders/bulk-find-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          threshold: 70
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find duplicates');
      }

      const data = await response.json();
      const foundDuplicates = data.duplicateGroups || [];

      // If no duplicates found but we have selected orders, create merge groups anyway
      if (foundDuplicates.length === 0 && selectedOrderIds.length >= 2) {
        // Fetch the selected orders to create manual merge groups
        const ordersResponse = await fetch('/api/orders/bulk-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIds: selectedOrderIds })
        });

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          const orders = ordersData.orders || [];

          if (orders.length >= 2) {
            // Create manual merge groups from selected orders
            const manualGroups: OrderDuplicateGroup[] = [];
            for (let i = 0; i < orders.length - 1; i += 2) {
              const groupOrders = orders.slice(i, i + 2);
              if (groupOrders.length === 2) {
                manualGroups.push({
                  id: `manual-group-${i / 2 + 1}`,
                  orders: groupOrders,
                  matchType: 'manual',
                  similarityScore: 0
                });
              }
            }

            // If there's an odd number of orders, add the last one to the last group
            if (orders.length % 2 === 1 && manualGroups.length > 0) {
              manualGroups[manualGroups.length - 1].orders.push(orders[orders.length - 1]);
            }

            setDuplicateGroups(manualGroups);
          }
        }
      } else {
        setDuplicateGroups(foundDuplicates);
      }

      setStep('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('list');
    }
  };

  const handleMergeGroup = (group: OrderDuplicateGroup) => {
    setSelectedGroup(group);
    setPrimaryOrder(group.orders[0]);
    setDuplicateOrder(group.orders[1]);

    // Initialize merged data with primary order data, but merge in non-empty values from other orders
    const mergedOrderData = { ...group.orders[0] };

    // For each field, use the first non-empty value found across all orders
    for (let i = 1; i < group.orders.length; i++) {
      const order = group.orders[i];
      if (!mergedOrderData.notes && order.notes) mergedOrderData.notes = order.notes;
      // For orders, we typically want to keep the highest total and most recent date
      if (Number(order.total) > Number(mergedOrderData.total)) {
        mergedOrderData.total = order.total;
      }
      // Use the most recent order date
      if (new Date(order.order_date) > new Date(mergedOrderData.order_date)) {
        mergedOrderData.order_date = order.order_date;
      }
    }

    setMergedData({
      contact_id: mergedOrderData.contact_id,
      status: mergedOrderData.status,
      total: mergedOrderData.total,
      order_date: mergedOrderData.order_date,
      notes: mergedOrderData.notes
    });

    setStep('merge');
  };

  const handleMergeOrders = async () => {
    if (!primaryOrder || !selectedGroup || !mergedData) return;

    setStep('merging');
    setLoading(true);

    try {
      // For groups with more than 2 orders, merge all non-primary orders into the primary one
      const ordersToMerge = selectedGroup.orders.filter(order => order.id !== primaryOrder.id);

      for (const orderToMerge of ordersToMerge) {
        const response = await fetch('/api/orders/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primaryOrderId: primaryOrder.id,
            duplicateOrderId: orderToMerge.id,
            mergedData
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to merge orders');
        }
      }

      // Remove the merged group from the list
      setDuplicateGroups(prev => prev.filter(group => group.id !== selectedGroup?.id));

      // Reset state
      setSelectedGroup(null);
      setPrimaryOrder(null);
      setDuplicateOrder(null);
      setMergedData({});
      setStep('list');

      // If no more duplicates, complete the process
      if (duplicateGroups.length <= 1) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('merge');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('loading');
    setDuplicateGroups([]);
    setSelectedGroup(null);
    setPrimaryOrder(null);
    setDuplicateOrder(null);
    setMergedData({});
    setError(null);
    onClose();
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'total':
        return 'bg-green-100 text-green-800';
      case 'contact':
        return 'bg-blue-100 text-blue-800';
      case 'date':
        return 'bg-yellow-100 text-yellow-800';
      case 'status':
        return 'bg-purple-100 text-purple-800';
      case 'multiple':
        return 'bg-red-100 text-red-800';
      case 'manual':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'proposed':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Merge Duplicates in Selection
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500">Finding duplicates in selected orders...</div>
          </div>
        )}

        {step === 'list' && (
          <div>
            {duplicateGroups.length === 0 ? (
              <div className="text-center py-8">
                <FaCopy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders to merge</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Unable to create merge groups from your selection.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {duplicateGroups[0]?.matchType === 'manual'
                    ? `Ready to merge ${duplicateGroups.length} group${duplicateGroups.length !== 1 ? 's' : ''} from your selection.`
                    : `Found ${duplicateGroups.length} duplicate group${duplicateGroups.length !== 1 ? 's' : ''} in your selection.`
                  }
                </p>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {duplicateGroups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(group.matchType)}`}>
                            {group.matchType === 'multiple' ? 'Multiple matches' :
                             group.matchType === 'manual' ? 'Manual merge' :
                             `${group.matchType} match`}
                          </span>
                          {group.matchType !== 'manual' && (
                            <span className="text-sm text-gray-600">
                              {group.similarityScore}% similarity
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleMergeGroup(group)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Merge
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.orders.map((order, index) => (
                          <div key={order.id} className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900">Order #{order.id.substring(0, 8)}</h4>
                            <div className="mt-1 text-sm text-gray-600 space-y-1">
                              <div>Contact: {order.contact_name || 'Unknown'}</div>
                              <div>Total: ${Number(order.total).toFixed(2)}</div>
                              <div>Date: {format(new Date(order.order_date), 'MMM d, yyyy')}</div>
                              <div>
                                Status: <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Merge Step */}
        {step === 'merge' && selectedGroup && primaryOrder && duplicateOrder && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setStep('list')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to merge list
              </button>
            </div>

            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Merge Orders
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Order */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-green-900">Primary Order</h5>
                  <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                    Will be kept
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-900">
                  <p><strong>Order ID:</strong> #{primaryOrder.id.substring(0, 8)}</p>
                  <p><strong>Contact:</strong> {primaryOrder.contact_name || 'Unknown'}</p>
                  <p><strong>Total:</strong> ${Number(primaryOrder.total).toFixed(2)}</p>
                  <p><strong>Date:</strong> {format(new Date(primaryOrder.order_date), 'MMM d, yyyy')}</p>
                  <p><strong>Status:</strong> {primaryOrder.status}</p>
                  <p><strong>Created:</strong> {format(new Date(primaryOrder.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {/* Duplicate Order */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-red-900">Order to Merge</h5>
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                    Will be deleted
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-900">
                  <p><strong>Order ID:</strong> #{duplicateOrder.id.substring(0, 8)}</p>
                  <p><strong>Contact:</strong> {duplicateOrder.contact_name || 'Unknown'}</p>
                  <p><strong>Total:</strong> ${Number(duplicateOrder.total).toFixed(2)}</p>
                  <p><strong>Date:</strong> {format(new Date(duplicateOrder.order_date), 'MMM d, yyyy')}</p>
                  <p><strong>Status:</strong> {duplicateOrder.status}</p>
                  <p><strong>Created:</strong> {format(new Date(duplicateOrder.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {/* Merged Result */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-3">Merged Order Data</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={mergedData.status || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="Cancelled">Cancelled</option>
                      <option value="Complete">Complete</option>
                      <option value="Paid">Paid</option>
                      <option value="Proposed">Proposed</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                    <input
                      type="number"
                      step="0.01"
                      value={mergedData.total || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, total: parseFloat(e.target.value) }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Order Date</label>
                    <input
                      type="date"
                      value={mergedData.order_date || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, order_date: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={mergedData.notes || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setStep('list')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeOrders}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Merge Orders
              </button>
            </div>
          </div>
        )}

        {/* Merging Step */}
        {step === 'merging' && (
          <div className="text-center py-8">
            <FaSync className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600">Merging orders...</p>
          </div>
        )}
      </div>
    </div>
  );
}
