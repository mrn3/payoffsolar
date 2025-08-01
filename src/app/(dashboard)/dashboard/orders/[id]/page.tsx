import React from 'react';
import Link from 'next/link';
import { requireAuth, isContact } from '@/lib/auth';
import { OrderModel } from '@/lib/models';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import {FaArrowLeft, FaDownload, FaEdit, FaUser, FaCalendarAlt, FaPhone, FaSms, FaEnvelope, FaFileInvoice} from 'react-icons/fa';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;

  // Require authentication
  const session = await requireAuth();
  const profile = session.profile;

  let order;
  let error;

  try {
    if (isContact(profile.role)) {
      // Contact users only see their own orders
      order = await OrderModel.getByIdForUser(id, profile.id);
    } else {
      // Admin and other roles see all orders
      order = await OrderModel.getWithItems(id);
    }

    if (!order) {
      notFound();
    }
  } catch (err) {
    console.error('Error loading order:', err);
    error = 'Failed to load order';
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!order) {
    notFound();
  }

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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Order #{order.id.substring(0, 8)}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            View order details and line items.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/api/orders/${order.id}/receipt`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaDownload className="mr-2 h-4 w-4" />
            Download Receipt
          </Link>
          <Link
            href={`/api/orders/${order.id}/invoice`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaFileInvoice className="mr-2 h-4 w-4" />
            View Invoice
          </Link>
          {!isContact(profile.role) && (
            <Link
              href={`/dashboard/orders/${order.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Edit Order
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="mt-1 text-sm text-gray-900">#{order.id.substring(0, 8)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">${Number(order.total).toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(order.order_date), 'MMM d, yyyy')}
                </dd>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Order Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>

            {order.items && order.items.length > 0 ? (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Product
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        SKU
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Quantity
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Price
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {item.product_id ? (
                            <Link
                              href={`/dashboard/products/${item.product_id}`}
                              className="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              {item.product_name || 'Unknown Product'}
                            </Link>
                          ) : (
                            item.product_name || 'Unknown Product'
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.product_sku || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="py-3 pl-4 pr-3 text-sm font-semibold text-gray-900 sm:pl-6 text-right">
                        Total:
                      </td>
                      <td className="py-3 px-3 text-sm font-semibold text-gray-900">
                        ${Number(order.total).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No items found for this order.</p>
              </div>
            )}
          </div>

          {/* Cost Breakdown - Only visible to admin users */}
          {!isContact(profile.role) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h2>

              {order.costItems && order.costItems.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Category
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {order.costItems.map((costItem) => (
                        <tr key={costItem.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {costItem.category_name || 'Unknown Category'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ${Number(costItem.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="py-3 pl-4 pr-3 text-sm font-semibold text-gray-900 sm:pl-6 text-right">
                          Total Internal Cost:
                        </td>
                        <td className="py-3 px-3 text-sm font-semibold text-gray-900">
                          ${order.costItems.reduce((total, item) => total + Number(item.amount), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="mt-3 text-xs text-gray-500">
                    * Cost breakdown is for internal tracking only and does not affect the order total.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No cost breakdown items found for this order.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaUser className="mr-2 h-5 w-5 text-gray-400" />
              Customer Information
            </h2>

            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.contact_id ? (
                    <Link
                      href={`/dashboard/contacts/${order.contact_id}`}
                      className="text-blue-600 hover:text-blue-900 hover:underline"
                    >
                      {order.contact_name}
                    </Link>
                  ) : (
                    order.contact_name
                  )}
                </dd>
              </div>

              {order.contact_phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="flex flex-col space-y-1">
                      <span className="text-gray-900">{order.contact_phone}</span>
                      <div className="flex space-x-3">
                        <a
                          href={`tel:${order.contact_phone}`}
                          className="inline-flex items-center text-green-600 hover:text-green-800 text-sm"
                          title="Call"
                        >
                          <FaPhone className="mr-1 h-3 w-3" />
                          Call
                        </a>
                        <a
                          href={`sms:${order.contact_phone}`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                          title="Text"
                        >
                          <FaSms className="mr-1 h-3 w-3" />
                          Text
                        </a>
                      </div>
                    </div>
                  </dd>
                </div>
              )}

              {order.contact_email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="flex flex-col space-y-1">
                      <span className="text-gray-900">{order.contact_email}</span>
                      <a
                        href={`mailto:${order.contact_email}`}
                        className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm w-fit"
                        title="Send Email"
                      >
                        <FaEnvelope className="mr-1 h-3 w-3" />
                        Email
                      </a>
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 h-5 w-5 text-gray-400" />
              Order Timeline
            </h2>

            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(order.updated_at), 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
