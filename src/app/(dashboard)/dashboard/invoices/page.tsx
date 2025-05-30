import React from 'react';
import Link from 'next/link';
import { FaPlus, FaEye, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { getUserProfile, isCustomer, requireAuth } from '@/lib/auth';
import { InvoiceModel } from '@/lib/models';
import { format } from 'date-fns';

export default async function InvoicesPage() {
  // Require authentication
  const session = await requireAuth();
  const profile = session.profile;

  let invoices = [];
  let error = null;

  try {
    if (isCustomer(profile.role)) {
      // Customer users only see their own invoices
      invoices = await InvoiceModel.getAllByUser(profile.id, 50, 0);
    } else {
      // Admin and other roles see all invoices
      invoices = await InvoiceModel.getAll(50, 0);
    }
    console.log('📄 Invoices loaded:', invoices.length, 'First invoice amount type:', typeof invoices[0]?.amount);
  } catch (err) {
    console.error('Error loading invoices:', err);
    error = 'Failed to load invoices';
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isCustomer(profile.role) ? 'My Invoices' : 'Invoices'}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {isCustomer(profile.role) 
              ? 'View and download your invoices.'
              : 'A list of all invoices in your system including their status and payment details.'
            }
          </p>
        </div>
        {!isCustomer(profile.role) && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Create invoice
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Invoices table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Invoice #
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
                      Amount
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Due Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {invoice.invoice_number}
                        </td>
                        {!isCustomer(profile.role) && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {invoice.customer_first_name && invoice.customer_last_name
                              ? `${invoice.customer_first_name} ${invoice.customer_last_name}`
                              : 'Unknown Customer'
                            }
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${Number(invoice.amount).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <button className="text-green-600 hover:text-green-900" title="View">
                              <FaEye className="h-4 w-4" />
                            </button>
                            <button className="text-blue-600 hover:text-blue-900" title="Download">
                              <FaDownload className="h-4 w-4" />
                            </button>
                            {!isCustomer(profile.role) && (
                              <>
                                <button className="text-orange-600 hover:text-orange-900" title="Edit">
                                  <FaEdit className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900" title="Delete">
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
                      <td colSpan={isCustomer(profile.role) ? 6 : 7} className="px-6 py-4 text-center text-sm text-gray-500">
                        {isCustomer(profile.role) ? 'You have no invoices yet.' : 'No invoices found.'}
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
      {invoices.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{invoices.length}</span> of{' '}
            <span className="font-medium">{invoices.length}</span> results
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
