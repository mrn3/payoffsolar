import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowLeft, FaEdit, FaDownload, FaPrint } from 'react-icons/fa';
import { requireAuth, isCustomer, isAdmin } from '@/lib/auth';
import { InvoiceModel, OrderModel } from '@/lib/models';
import { format } from 'date-fns';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  // Require authentication
  const session = await requireAuth();
  const profile = session.profile;

  const { id } = await params;

  let invoice = null;
  let order = null;
  let error = null;

  try {
    if (isCustomer(profile.role)) {
      // Customer users can only see their own invoices
      invoice = await InvoiceModel.getByIdForUser(id, profile.id);
    } else {
      // Admin and other roles can see all invoices
      invoice = await InvoiceModel.getWithDetails(id);
    }

    if (!invoice) {
      notFound();
    }

    // Get the associated order details
    order = await OrderModel.getWithItems(invoice.order_id);
    console.log('📄 Invoice loaded:', invoice.invoice_number);
  } catch (err) {
    console.error('Error loading invoice:', err);
    error = 'Failed to load invoice';
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Link>
      </div>

      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Invoice {invoice?.invoice_number}
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice?.status || '')}`}>
                {invoice?.status}
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              Created {invoice?.created_at ? format(new Date(invoice.created_at), 'MMM d, yyyy') : 'N/A'}
            </div>
            {invoice?.due_date && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                Due {format(new Date(invoice.due_date), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href={`/api/invoices/${invoice?.id}/download`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaDownload className="mr-2 h-4 w-4" />
            Download
          </Link>
          {!isCustomer(profile.role) && (
            <Link
              href={`/dashboard/invoices/${invoice?.id}/edit`}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Complete invoice information and billing details.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{invoice?.invoice_number}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {invoice?.customer_first_name && invoice?.customer_last_name
                  ? `${invoice.customer_first_name} ${invoice.customer_last_name}`
                  : 'Unknown Customer'
                }
                {invoice?.customer_email && (
                  <div className="text-gray-500">{invoice.customer_email}</div>
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
                ${Number(invoice?.amount || 0).toFixed(2)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice?.status || '')}`}>
                  {invoice?.status}
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {invoice?.due_date ? format(new Date(invoice.due_date), 'MMMM d, yyyy') : 'Not set'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {invoice?.created_at ? format(new Date(invoice.created_at), 'MMMM d, yyyy \'at\' h:mm a') : 'N/A'}
              </dd>
            </div>
            {order && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Related Order</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="text-green-600 hover:text-green-900"
                  >
                    Order #{order.id.slice(-8)} - ${Number(order.total).toFixed(2)}
                  </Link>
                  <div className="text-gray-500 text-xs mt-1">
                    Status: <span className="capitalize">{order.status}</span>
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Order Items (if available) */}
      {order?.items && order.items.length > 0 && (
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Order Items</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Items included in this invoice.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product_name || 'Unknown Product'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${Number(item.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
