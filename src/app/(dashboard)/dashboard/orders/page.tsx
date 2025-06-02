'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaPlus, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';

interface Order {
  id: string;
  customer_id: string;
  status: string;
  total: number | string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer_first_name?: string;
  customer_last_name?: string;
}

interface UserProfile {
  id: string;
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

  useEffect(() => {
    fetchData();
  }, []);

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

      // Then get orders
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
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

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the order from the list
        setOrders(prev => prev.filter(order => order.id !== orderId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order');
    }
  };

  const isCustomer = (role: string | null) => {
    return role === 'customer';
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
            {isCustomer(profile.role) ? 'My Orders' : 'Orders'}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {isCustomer(profile.role)
              ? 'View and track your orders.'
              : 'A list of all orders in your system including their status and customer details.'
            }
          </p>
        </div>
        {!isCustomer(profile.role) && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/dashboard/orders/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add order
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
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
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Order ID
                    </th>
                    {!isCustomer(profile.role) && (
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Customer
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
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          #{order.id.substring(0, 8)}
                        </td>
                        {!isCustomer(profile.role) && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {order.customer_first_name && order.customer_last_name
                              ? `${order.customer_first_name} ${order.customer_last_name}`
                              : 'Unknown Customer'
                            }
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${Number(order.total).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(order.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="text-green-600 hover:text-green-900"
                              title="View order"
                            >
                              <FaEye className="h-4 w-4" />
                            </Link>
                            {!isCustomer(profile.role) && (
                              <>
                                <Link
                                  href={`/dashboard/orders/${order.id}/edit`}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit order"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </Link>
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete order"
                                  onClick={() => handleDeleteOrder(order.id)}
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
                      <td colSpan={isCustomer(profile.role) ? 5 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                        {isCustomer(profile.role) ? 'You have no orders yet.' : 'No orders found.'}
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
    </div>
  );
}
