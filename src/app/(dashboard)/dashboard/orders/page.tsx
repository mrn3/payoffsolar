'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import ImportOrdersModal from '@/components/orders/ImportOrdersModal';
import DeleteAllOrdersModal from '@/components/orders/DeleteAllOrdersModal';
import DuplicateOrdersModal from '@/components/orders/DuplicateOrdersModal';
import BulkMergeOrdersModal from '@/components/orders/BulkMergeOrdersModal';
import OrderFiltersComponent, { OrderFilters } from '@/components/orders/OrderFilters';
import toast from 'react-hot-toast';
import {FaDownload, FaEdit, FaEye, FaPlus, FaSearch, FaTrash, FaUpload, FaCopy, FaFileInvoice, FaSort, FaSortUp, FaSortDown} from 'react-icons/fa';

import Pagination from '@/components/ui/Pagination';

import { getGlobalPageSize, setGlobalPageSize } from '@/lib/paginationPrefs';

interface Order {
  id: string;
  contact_id: string;
  status: string;
  total: number | string;
  order_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  contact_name?: string;
  contact_city?: string;
  contact_state?: string;
  contact_address?: string;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<number>(() => getGlobalPageSize(10));
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);
  const [showBulkMergeModal, setShowBulkMergeModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<OrderFilters>({
    contactName: '',
    productId: '',
    city: '',
    state: '',
    status: [],
    minTotal: '',
    maxTotal: '',
    startDate: '',
    endDate: ''
  });

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'order_date',
    direction: 'desc'
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters, sortConfig]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchOrders = async (page: number, limitNum: number = pageSize) => {
    try {
      setLoading(true);

      // First get user profile
      const profileRes = await fetch('/api/auth/profile');
      if (!profileRes.ok) {
        window.location.href = '/login';
        return;
      }

      const profileData = await profileRes.json();
      setProfile(profileData.profile);

      // Then get orders with pagination and filter parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limitNum.toString()
      });

      // Add legacy search parameter
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      // Add filter parameters
      if (filters.contactName) {
        params.append('contactName', filters.contactName);
      }
      if (filters.productId) {
        params.append('productId', filters.productId);
      }
      if (filters.city) {
        params.append('city', filters.city);
      }
      if (filters.state) {
        params.append('state', filters.state);
      }
      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      if (filters.minTotal) {
        params.append('minTotal', filters.minTotal);
      }
      if (filters.maxTotal) {
        params.append('maxTotal', filters.maxTotal);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      // Add sort parameters
      params.append('sortField', sortConfig.field);
      params.append('sortDirection', sortConfig.direction);

      const ordersRes = await fetch(`/api/orders?${params}`);
      if (ordersRes.ok) {
        const ordersData: OrdersResponse = await ordersRes.json();
        setOrders(ordersData.orders || []);
        setCurrentPage(ordersData.pagination.page);
        setTotalPages(ordersData.pagination.totalPages);
        setTotal(ordersData.pagination.total);
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      contactName: '',
      productId: '',
      city: '',
      state: '',
      status: [],
      minTotal: '',
      maxTotal: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    setSortConfig(prevSort => ({
      field,
      direction: prevSort.field === field && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return <FaSort className="ml-1 h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc'
      ? <FaSortUp className="ml-1 h-3 w-3 text-gray-600" />
      : <FaSortDown className="ml-1 h-3 w-3 text-gray-600" />;
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
        // Refresh the orders list
        fetchOrders(currentPage);
      } else {
        const errorData = await _response.json();
        toast.error(errorData.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error('Error deleting _order:', err);
      toast.error('Failed to delete order');
    }
  };

  const handleDuplicatesComplete = () => {
    fetchOrders(currentPage);
  };

  const handleBulkMergeComplete = () => {
    setSelectedOrders(new Set());
    setShowBulkMergeModal(false);
    fetchOrders(currentPage);
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
        fetchOrders(currentPage); // Refresh the orders list
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
        fetchOrders(1, searchQuery); // Refresh the orders list
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

  const formatLocation = (order: Order) => {
    const parts = [];
    if (order.contact_city) {
      parts.push(order.contact_city);
    }
    if (order.contact_state) {
      parts.push(order.contact_state);
    }
    return parts.length > 0 ? parts.join(', ') : '-';
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
                type="button"
                onClick={() => setIsDuplicatesModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
              >
                <FaCopy className="mr-2 h-4 w-4" />
                Find Duplicates
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
              >
                <FaUpload className="mr-2 h-4 w-4" />
                Import
              </button>
              {total > 0 && (
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

      {/* Search */}
      {!isContact(profile.role) && (
        <div className="mt-6 flex flex-col sm:flex-row">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={localSearchQuery}
              onChange={handleSearch}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Search orders by contact name"
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {!isContact(profile.role) && (
        <div className="mt-6">
          <OrderFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
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
                  <option value="Cancelled">Cancelled</option>
                  <option value="Complete">Complete</option>
                  <option value="Paid">Paid</option>
                  <option value="Proposed">Proposed</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkMergeModal(true)}
                disabled={selectedOrders.size < 2}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCopy className="mr-1 h-3 w-3" />
                Merge Duplicates
              </button>
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
                      <button
                        className="flex items-center hover:text-gray-600"
                        onClick={() => handleSort('id')}
                      >
                        Order ID
                        {getSortIcon('id')}
                      </button>
                    </th>
                    {!isContact(profile.role) && (
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <button
                          className="flex items-center hover:text-gray-600"
                          onClick={() => handleSort('contact_name')}
                        >
                          Contact
                          {getSortIcon('contact_name')}
                        </button>
                      </th>
                    )}
                    {!isContact(profile.role) && (
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <button
                          className="flex items-center hover:text-gray-600"
                          onClick={() => handleSort('contact_city')}
                        >
                          Location
                          {getSortIcon('contact_city')}
                        </button>
                      </th>
                    )}
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        className="flex items-center hover:text-gray-600"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        className="flex items-center hover:text-gray-600"
                        onClick={() => handleSort('total')}
                      >
                        Total
                        {getSortIcon('total')}
                      </button>
                    </th>
                    {!isContact(profile.role) && (
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <button
                          className="flex items-center hover:text-gray-600"
                          onClick={() => handleSort('total_internal_cost')}
                        >
                          Internal Cost
                          {getSortIcon('total_internal_cost')}
                        </button>
                      </th>
                    )}
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        className="flex items-center hover:text-gray-600"
                        onClick={() => handleSort('order_date')}
                      >
                        Date
                        {getSortIcon('order_date')}
                      </button>
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
                          <Link
                            href={`/dashboard/orders/${_order.id}`}
                            className="text-green-600 hover:text-green-900 hover:underline"
                          >
                            #{_order.id.substring(0, 8)}
                          </Link>
                        </td>
                        {!isContact(profile.role) && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {_order.contact_id ? (
                              <Link
                                href={`/dashboard/contacts/${_order.contact_id}`}
                                className="text-green-600 hover:text-green-900 hover:underline"
                              >
                                {_order.contact_name || 'Unknown Contact'}
                              </Link>
                            ) : (
                              _order.contact_name || 'Unknown Contact'
                            )}
                          </td>
                        )}
                        {!isContact(profile.role) && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatLocation(_order)}
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
                        {!isContact(profile.role) && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ${Number(_order.total_internal_cost || 0).toFixed(2)}
                          </td>
                        )}
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
                            <Link
                              href={`/api/orders/${_order.id}/invoice`}
                              className="text-purple-600 hover:text-purple-900"
                              title="View invoice"
                            >
                              <FaFileInvoice className="h-4 w-4" />
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
                        {isContact(profile.role)
                          ? 'You have no orders yet.'
                          : searchQuery
                            ? 'No orders found matching your search.'
                            : 'No orders found.'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {!loading && orders.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={(p) => fetchOrders(p)}
          onPageSizeChange={(size) => { setPageSize(size); setGlobalPageSize(size); fetchOrders(1, size); }}
        />
      )}

      {/* Import Modal */}
      <ImportOrdersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          setShowImportModal(false);
          fetchOrders(currentPage); // Refresh the orders list
        }}
      />

      {/* Delete All Orders Modal */}
      <DeleteAllOrdersModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAllOrders}
        orderCount={total}
      />

      {/* Duplicate Orders Modal */}
      <DuplicateOrdersModal
        isOpen={isDuplicatesModalOpen}
        onClose={() => setIsDuplicatesModalOpen(false)}
        onMergeComplete={handleDuplicatesComplete}
      />

      {/* Bulk Merge Orders Modal */}
      <BulkMergeOrdersModal
        isOpen={showBulkMergeModal}
        onClose={() => setShowBulkMergeModal(false)}
        selectedOrderIds={Array.from(selectedOrders)}
        onComplete={handleBulkMergeComplete}
      />
    </div>
  );
}
