'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OrderWithContact, AffiliateCode } from '@/lib/models';
import { FaArrowLeft, FaArrowUp, FaArrowDown, FaEdit } from 'react-icons/fa';
import Pagination from '@/components/ui/Pagination';

interface OrdersResponse {
  orders: OrderWithContact[];
  affiliateCode: AffiliateCode;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function OrdersByAffiliateCodePage() {
  const searchParams = useSearchParams();
  const affiliateCodeId = searchParams.get('affiliateCodeId');

  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    field: 'order_date',
    direction: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    if (!affiliateCodeId) {
      setError('No affiliate code ID provided');
      setLoading(false);
      return;
    }
    fetchOrders(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiliateCodeId, currentPage, sortConfig.field, sortConfig.direction]);

  const fetchOrders = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        affiliateCodeId: affiliateCodeId!,
        page: page.toString(),
        limit: '10',
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction,
      });

      const res = await fetch(`/api/orders/by-affiliate-code?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load orders');
      }
      const json: OrdersResponse = await res.json();
      setData(json);
      setError('');
    } catch (err: unknown) {
      console.error('Error loading orders by affiliate code:', err);
      const message = err instanceof Error ? err.message : 'Failed to load orders';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? (
      <FaArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <FaArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-700">{error}</div>
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

  const { orders, affiliateCode, pagination } = data;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-4">
        <div className="sm:flex-auto">
          <div className="flex items-center mb-4">
            <Link
              href="/dashboard/affiliate-codes"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Back to Affiliate Codes
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Orders Using &quot;{affiliateCode.code}&quot;
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">{pagination.total}</span> orders found using this affiliate code.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button className="flex items-center" onClick={() => handleSort('id')}>
                        Order ID
                        {getSortIcon('id')}
                      </button>
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button className="flex items-center" onClick={() => handleSort('contact_name')}>
                        Contact
                        {getSortIcon('contact_name')}
                      </button>
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button className="flex items-center" onClick={() => handleSort('status')}>
                        Status
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Matt Profit
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button className="flex items-center" onClick={() => handleSort('total')}>
                        Total
                        {getSortIcon('total')}
                      </button>
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <button className="flex items-center" onClick={() => handleSort('order_date')}>
                        Date
                        {getSortIcon('order_date')}
                      </button>
                    </th>
                    <th className="py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">
                      Actions
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
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatCurrency(order.matt_profit_amount ?? 0)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(order.order_date)}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/dashboard/orders/${order.id}/edit`}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            <FaEdit className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No orders found using this affiliate code.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.limit}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

