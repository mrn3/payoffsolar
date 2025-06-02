import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';
import { requireAuth, isAdmin } from '@/lib/auth';
import { InvoiceModel, OrderModel } from '@/lib/models';
import EditInvoiceForm from './components/EditInvoiceForm';

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;

  let invoice = null;
  let orders = [];
  let error = null;

  try {
    invoice = await InvoiceModel.getWithDetails(id);
    if (!invoice) {
      notFound();
    }

    // Get all orders for the dropdown
    orders = await OrderModel.getAll(100, 0);
    console.log('📄 Invoice loaded for editing:', invoice.invoice_number);
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

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/invoices/${id}`}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoice
        </Link>
      </div>

      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Edit Invoice {invoice?.invoice_number}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update invoice details and billing information.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <EditInvoiceForm invoice={invoice!} orders={orders} />
      </div>
    </div>
  );
}
