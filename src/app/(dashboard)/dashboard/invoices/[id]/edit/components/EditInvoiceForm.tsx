'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceWithCustomer, OrderWithCustomer } from '@/lib/models';

interface EditInvoiceFormProps {
  invoice: InvoiceWithCustomer;
  orders: OrderWithCustomer[];
}

export default function EditInvoiceForm({ invoice, orders }: EditInvoiceFormProps) {
  const [formData, setFormData] = useState({
    order_id: invoice.order_id,
    invoice_number: invoice.invoice_number,
    amount: invoice.amount.toString(),
    status: invoice.status,
    due_date: invoice.due_date ? invoice.due_date.split('T')[0] : ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const selectedOrder = orders.find(order => order.id === formData.order_id);

  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setFormData(prev => ({
      ...prev,
      order_id: orderId,
      amount: order ? order.total.toString() : prev.amount
    }));
    setErrors(prev => ({ ...prev, order_id: '', amount: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update invoice');
      }

      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error updating invoice:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update invoice' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Invoice Details</h3>
            <p className="mt-1 text-sm text-gray-500">
              Update the invoice details and billing information.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6">
                <label htmlFor="order_id" className="block text-sm font-medium text-gray-700">
                  Order *
                </label>
                <select
                  id="order_id"
                  name="order_id"
                  value={formData.order_id}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  required
                >
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Order #{order.id.slice(-8)} - {order.customer_first_name} {order.customer_last_name} - ${Number(order.total).toFixed(2)}
                    </option>
                  ))}
                </select>
                {errors.order_id && <p className="mt-1 text-sm text-red-600">{errors.order_id}</p>}
              </div>

              {selectedOrder && (
                <div className="col-span-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900">Order Details</h4>
                    <dl className="mt-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <dt>Customer:</dt>
                        <dd>{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Order Total:</dt>
                        <dd>${Number(selectedOrder.total).toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Status:</dt>
                        <dd className="capitalize">{selectedOrder.status}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  name="invoice_number"
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                  className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                />
                {errors.invoice_number && <p className="mt-1 text-sm text-red-600">{errors.invoice_number}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    required
                  />
                </div>
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="due_date"
                  id="due_date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                />
                {errors.due_date && <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{errors.submit}</div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Updating...' : 'Update Invoice'}
        </button>
      </div>
    </form>
  );
}
