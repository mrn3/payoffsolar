'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';
import { Payment } from '@/lib/models';

interface PaymentManagerProps {
  orderId: string;
  payments: Payment[];
  orderTotal: number;
  onPaymentsChange: () => void;
}

const PAYMENT_TYPES = [
  'Stripe',
  'Cash',
  'Check',
  'America First Credit Union Account Transfer',
  'Wells Fargo Wire',
  'Venmo',
  'PayPal',
  'Cash App',
  'Apple Pay',
  'Zelle'
];

export default function PaymentManager({ orderId, payments, orderTotal, onPaymentsChange }: PaymentManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'Stripe',
    amount: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balanceOwed = orderTotal - totalPaid;

  const resetForm = () => {
    setFormData({
      payment_date: new Date().toISOString().split('T')[0],
      payment_type: 'Stripe',
      amount: '',
      notes: ''
    });
    setIsAdding(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingId ? `/api/payments/${editingId}` : '/api/payments';
      const method = editingId ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save payment');
      }

      resetForm();
      onPaymentsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment: Payment) => {
    setFormData({
      payment_date: payment.payment_date,
      payment_type: payment.payment_type,
      amount: payment.amount.toString(),
      notes: payment.notes || ''
    });
    setEditingId(payment.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete payment');
      onPaymentsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Payments</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Payment
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Payment Summary */}
      <div className="mb-4 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Order Total</p>
          <p className="text-lg font-semibold text-gray-900">${orderTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-lg font-semibold text-green-600">${totalPaid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Balance Owed</p>
          <p className={`text-lg font-semibold ${balanceOwed > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            ${balanceOwed.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Add/Edit Payment Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type *
              </label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {PAYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FaTimes className="mr-2 h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <FaCheck className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : editingId ? 'Update Payment' : 'Add Payment'}
            </button>
          </div>
        </form>
      )}

      {/* Payments List */}
      {payments.length > 0 ? (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notes</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                    {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {payment.payment_type}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                    ${Number(payment.amount).toFixed(2)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {payment.notes || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                    <button
                      onClick={() => handleEdit(payment)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(payment.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No payments recorded yet.</p>
        </div>
      )}
    </div>
  );
}

