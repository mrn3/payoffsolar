import React from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { requireAuth, isAdmin } from '@/lib/auth';
import { OrderModel } from '@/lib/models';
import { redirect } from 'next/navigation';
import CreateInvoiceForm from './components/CreateInvoiceForm';

export default async function CreateInvoicePage() {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  let orders = [];
  let error = null;

  try {
    // Get all orders that don't have invoices yet
    orders = await OrderModel.getAll(100, 0);
    console.log('📄 Orders loaded for invoice creation:', orders.length);
  } catch (err) {
    console.error('Error loading orders:', err);
    error = 'Failed to load orders';
  }

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
            Create Invoice
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create a new invoice for an existing order.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      <div className="mt-8">
        <CreateInvoiceForm orders={orders} />
      </div>
    </div>
  );
}
