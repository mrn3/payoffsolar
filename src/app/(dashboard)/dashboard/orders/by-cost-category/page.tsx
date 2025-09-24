'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OrderWithContact, CostCategory } from '@/lib/models';
import { FaEdit, FaTrash, FaArrowLeft, FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface OrdersResponse {
  orders: OrderWithContact[];
  category: CostCategory;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function OrdersByCostCategoryPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    field: 'order_date',
    direction: 'desc' as 'asc' | 'desc'
  });

  useEffect(() => {
    if (categoryId) {
      fetchOrders(currentPage);
    } else {
      setError('No category ID provided');
      setLoading(false);
    }
  }, [categoryId, currentPage, sortConfig]);

  const fetchOrders = async (page: number) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        categoryId: categoryId!,
        page: page.toString(),
        limit: '10',
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction
      });

      const response = await fetch(`/api/orders/by-cost-category?${params}`);
      
      if (response.ok) {
        const responseData: OrdersResponse = await response.json();
        setData(responseData);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? 
      <FaArrowUp className="ml-1 h-3 w-3" /> : 
      <FaArrowDown className="ml-1 h-3 w-3" />;
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'proposed':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const { orders, category, pagination } = data;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center mb-4">
            <Link
              href="/dashboard/cost-categories"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Back to Cost Categories
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Orders Using "{category.name}"
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {category.description && (
              <span className="block mb-2">{category.description}</span>
            )}
            <span className="font-medium">{pagination.total}</span> orders found using this cost category
          </p>
        </div>
      </div>

      {/* Orders table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        className="flex items-center hover:text-gray-600"
                        onClick={() => handleSort('id')}
                      >
                        Order ID
                        {getSortIcon('id')}
                      </button>
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button
                        className="flex items-center hover:text-gray-600"
                        onClick={() => handleSort('contact_name')}
                      >
                        Contact
                        {getSortIcon('contact_name')}
                      </button>
                    </th>
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
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="text-green-600 hover:text-green-900 hover:underline"
                          >
                            #{order.id.substring(0, 8)}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {order.contact_id ? (
                            <Link
                              href={`/dashboard/contacts/${order.contact_id}`}
                              className="text-green-600 hover:text-green-900 hover:underline"
                            >
                              {order.contact_name || 'Unknown Contact'}
                            </Link>
                          ) : (
                            order.contact_name || 'Unknown Contact'
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {order.order_date ? formatDate(order.order_date) : 'N/A'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/dashboard/orders/${order.id}/edit`}
                              className="text-orange-600 hover:text-orange-900"
                              title="Edit order"
                            >
                              <FaEdit className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No orders found using this cost category.
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
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
