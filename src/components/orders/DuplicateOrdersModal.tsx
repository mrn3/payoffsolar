'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { OrderWithContact } from '@/lib/models';
import { OrderDuplicateGroup, smartMergeOrders } from '@/lib/utils/duplicates';
import { FaTimes, FaExclamationTriangle, FaSync, FaCheck } from 'react-icons/fa';

interface DuplicateOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: () => void;
}

interface DuplicatesResponse {
  duplicateGroups: OrderDuplicateGroup[];
  totalGroups: number;
  totalDuplicateOrders: number;
}

export default function DuplicateOrdersModal({ isOpen, onClose, onMergeComplete }: DuplicateOrdersModalProps) {
  const [step, setStep] = useState<'loading' | 'list' | 'merge' | 'merging'>('loading');
  const [duplicateGroups, setDuplicateGroups] = useState<OrderDuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<OrderDuplicateGroup | null>(null);
  const [primaryOrder, setPrimaryOrder] = useState<OrderWithContact | null>(null);
  const [duplicateOrder, setDuplicateOrder] = useState<OrderWithContact | null>(null);
  const [mergedData, setMergedData] = useState<Partial<OrderWithContact>>({});
  const [threshold, setThreshold] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      findDuplicates();
    }
  }, [isOpen, threshold]);

  const findDuplicates = async () => {
    setStep('loading');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/duplicates?threshold=${threshold}`);
      if (!response.ok) {
        throw new Error('Failed to find duplicates');
      }

      const data: DuplicatesResponse = await response.json();
      setDuplicateGroups(data.duplicateGroups);
      setStep('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('list');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeGroup = (group: OrderDuplicateGroup) => {
    setSelectedGroup(group);
    // Set the first order as primary by default
    setPrimaryOrder(group.orders[0]);
    setDuplicateOrder(group.orders[1]);

    // Initialize merged data with smart merge logic
    const smartMerged = smartMergeOrders(group.orders[0], group.orders[1]);
    setMergedData({
      contact_id: smartMerged.contact_id,
      status: smartMerged.status,
      total: smartMerged.total,
      order_date: smartMerged.order_date,
      notes: smartMerged.notes
    });

    setStep('merge');
  };

  const handleMergeOrders = async () => {
    if (!primaryOrder || !duplicateOrder || !mergedData) return;

    setStep('merging');
    setLoading(true);

    try {
      const response = await fetch('/api/orders/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryOrderId: primaryOrder.id,
          duplicateOrderId: duplicateOrder.id,
          mergedData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to merge orders');
      }

      // Remove the merged group from the list
      setDuplicateGroups(prev => prev.filter(group => group.id !== selectedGroup?.id));
      
      // Reset state
      setSelectedGroup(null);
      setPrimaryOrder(null);
      setDuplicateOrder(null);
      setMergedData({});
      setStep('list');
      
      onMergeComplete();
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
      case 'total': return 'bg-green-100 text-green-800';
      case 'contact': return 'bg-blue-100 text-blue-800';
      case 'date': return 'bg-yellow-100 text-yellow-800';
      case 'status': return 'bg-purple-100 text-purple-800';
      case 'multiple': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Find and Merge Duplicate Orders
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Step */}
        {step === 'loading' && (
          <div className="text-center py-8">
            <FaSync className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600">Scanning for duplicate orders...</p>
          </div>
        )}

        {/* List Step */}
        {step === 'list' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  Similarity Threshold:
                </label>
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value={60}>60% - More matches</option>
                  <option value={70}>70% - Balanced</option>
                  <option value={80}>80% - Fewer matches</option>
                  <option value={90}>90% - Very strict</option>
                </select>
                <button
                  onClick={findDuplicates}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaSync className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {duplicateGroups.length === 0 ? (
              <div className="text-center py-8">
                <FaCheck className="mx-auto h-12 w-12 text-green-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h4>
                <p className="text-gray-600">
                  No potential duplicate orders were found with the current threshold.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Found {duplicateGroups.length} potential duplicate groups affecting{' '}
                  {duplicateGroups.reduce((sum, group) => sum + group.orders.length, 0)} orders.
                </p>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {duplicateGroups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(group.matchType)}`}>
                            {group.matchType === 'multiple' ? 'Multiple matches' : `${group.matchType} match`}
                          </span>
                          <span className="text-sm text-gray-600">
                            {group.similarityScore}% similarity
                          </span>
                        </div>
                        <button
                          onClick={() => handleMergeGroup(group)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          Merge
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.orders.map((order, index) => (
                          <div key={order.id} className="bg-gray-50 rounded-md p-3">
                            <h4 className="font-medium text-gray-900">
                              Order #{order.id.substring(0, 8)}
                            </h4>
                            <div className="mt-1 text-sm text-gray-900 space-y-1">
                              <p>Contact: {order.contact_name || 'Unknown'}</p>
                              <p>Total: ${Number(order.total).toFixed(2)}</p>
                              <p>Date: {format(new Date(order.order_date), 'MMM d, yyyy')}</p>
                              <p>
                                Status: <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </p>
                              <p>Created: {format(new Date(order.created_at), 'MMM d, yyyy')}</p>
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
                ← Back to duplicates list
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
                  <h5 className="font-medium text-red-900">Duplicate Order</h5>
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
                      rows={3}
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
