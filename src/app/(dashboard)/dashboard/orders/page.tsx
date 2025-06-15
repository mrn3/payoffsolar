'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import ImportOrdersModal from '@/components/orders/ImportOrdersModal';
import DeleteAllOrdersModal from '@/components/orders/DeleteAllOrdersModal';
import toast from 'react-hot-toast';
import {FaDownload, FaEdit, FaEye, FaPlus, FaTrash, FaUpload} from 'react-icons/fa';

interface Order {
  _id: string;
  contact_id: string;
  status: string;
  total: number | string;
  order_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  contact_name?: string;
}

interface UserProfile {
  _id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      // First get user profile
      const profileRes = await fetch('/api/auth/profile');
      if (!profileRes.ok) {
        window.location.href = '/login';
        return;
      }

      const profileData = await profileRes.json();
      setProfile(profileData.profile);

      // Then get orders (fetch all orders by setting a high limit)
      const ordersRes = await fetch('/api/orders?limit=1000');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading _data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      const _response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (_response.ok) {
        // Remove the order from the list
        setOrders(prev => prev.filter(_order => _order.id !== orderId));
      } else {
        const errorData = await _response.json();
        toast.error(errorData.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error('Error deleting _order:', err);
      toast.error('Failed to delete order');
    }
  };

  const isContact = (role: string | null) => {
    return role === 'contact';
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(_order => _order.id)));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrders.size === 0 || !bulkStatus) {
      toast.error('Please select orders and choose a status');
      return;
    }

    setBulkUpdating(true);
    try {
      const _response = await fetch('/api/orders/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrders),
          status: bulkStatus
        }),
      });

      if (_response.ok) {
        const _data = await _response.json();
        toast.success(_data.message);
        setSelectedOrders(new Set());
        setBulkStatus('');
        fetchData(); // Refresh the orders list
      } else {
        const errorData = await _response.json();
        toast.error(errorData.error || 'Failed to update orders');
      }
    } catch (err) {
      console.error('Error updating orders:', err);
      toast.error('Failed to update orders');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleDeleteAllOrders = async () => {
    try {
      const _response = await fetch('/api/orders/delete-all', {
        method: 'DELETE',
      });

      if (_response.ok) {
        const _data = await _response.json();
        toast.success(_data.message);
        setSelectedOrders(new Set());
        setBulkStatus('');
        fetchData(); // Refresh the orders list
      } else {
        const errorData = await _response.json();
        toast.error(errorData.error || 'Failed to delete all orders');
      }
    } catch (err) {
      console.error('Error deleting all orders:', err);
      toast.error('Failed to delete all orders');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-600">Failed to load user profile</div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isContact(profile.role) ? 'My Orders' : 'Orders' }
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {isContact(profile.role)
              ? 'View and track your orders.'
              : 'A list of all orders in your system including their status and contact details.'
            }
          </p>
        </div>
        {!isContact(profile.role) && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
              >
                <FaUpload className="mr-2 h-4 w-4" />
                Import
              </button>
              {orders.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
                >
                  <FaTrash className="mr-2 h-4 w-4" />
                  Delete All
                </button>
              )}
              <Link
                href="/dashboard/orders/new"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Add order
              </Link>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {!isContact(profile.role) && selectedOrders.size > 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <label htmlFor="bulk-status" className="text-sm font-medium text-gray-700">
                  Update status to:
                </label>
                <select
                  id="bulk-status"
                  value={bulkStatus}
                  onChange={(_e) => setBulkStatus(_e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm"
                >
                  <option value="">Select status...</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus || bulkUpdating}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkUpdating ? 'Updating...' : 'Update Status' }
              </button>
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    {!isContact(profile.role) && (
                      <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          checked={orders.length > 0 && selectedOrders.size === orders.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Order ID
                    </th>
                    {!isContact(profile.role) && (
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Contact
                      </th>
                    )}
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.length > 0 ? (
                    orders.map((_order) => (
                      <tr key={_order.id} className={selectedOrders.has(_order.id) ? 'bg-gray-50' : ''}>
                        {!isContact(profile.role) && (
                          <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                            <input
                              type="checkbox"
                              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              checked={selectedOrders.has(_order.id)}
                              onChange={() => handleSelectOrder(_order.id)}
                            />
                          </td>
                        )}
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          #{_order.id.substring(0, 8)}
                        </td>
                        {!isContact(profile.role) && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {_order.contact_name || 'Unknown Contact'}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(_order.status)}`}>
                            {_order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${Number(_order.total).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(_order.order_date), 'MMM d, yyyy')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/dashboard/orders/${_order.id}`}
                              className="text-green-600 hover:text-green-900"
                              title="View order"
                            >
                              <FaEye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/api/orders/${_order.id}/receipt`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Download receipt"
                            >
                              <FaDownload className="h-4 w-4" />
                            </Link>
                            {!isContact(profile.role) && (
                              <>
                                <Link
                                  href={`/dashboard/orders/${_order.id}/edit`}
                                  className="text-orange-600 hover:text-orange-900"
                                  title="Edit order"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </Link>
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete order"
                                  onClick={() => handleDeleteOrder(_order.id)}
                                >
                                  <FaTrash className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isContact(profile.role) ? 5 : 7} className="px-6 py-4 text-center text-sm text-gray-500">
                        {isContact(profile.role) ? 'You have no orders yet.' : 'No orders found.' }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination placeholder */}
      {orders.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{orders.length}</span> of{' '}
            <span className="font-medium">{orders.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportOrdersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          setShowImportModal(false);
          fetchData(); // Refresh the orders list
        }}
      />

      {/* Delete All Orders Modal */}
      <DeleteAllOrdersModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAllOrders}
        orderCount={orders.length}
      />
    </div>
  );
}
