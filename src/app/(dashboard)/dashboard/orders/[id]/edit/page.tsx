'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {useParams, useRouter} from 'next/navigation';
import { Order, OrderItem, Contact, Product } from '@/lib/models';
import ContactAutocomplete from '@/components/ui/ContactAutocomplete';
import {FaArrowLeft, FaPlus, FaTrash} from 'react-icons/fa';

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    contact_id: '',
    status: 'pending',
    order_date: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, price: 0 }] as OrderItem[]
  });

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      const [contactsRes, productsRes, orderRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/products'),
        fetch(`/api/orders/${orderId}`)
      ]);

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.contacts || []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const _order: Order = orderData.order;

        // Format order_date for HTML date input (YYYY-MM-DD)
        let formattedOrderDate = '';
        if (_order.order_date) {
          const date = new Date(_order.order_date);
          if (!isNaN(date.getTime())) {
            formattedOrderDate = date.toISOString().split('T')[0];
          }
        }

        setFormData({
          contact_id: _order.contact_id || '',
          status: _order.status,
          order_date: formattedOrderDate,
          notes: _order.notes || '',
          items: _order.items && _order.items.length > 0
            ? _order.items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: Number(item.price)
              }))
            : [{ product_id: '', quantity: 1, price: 0 }]
        });
      } else {
        setError('Failed to load order');
      }
    } catch (err) {
      console.error('Error fetching _data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (_e: React.FormEvent) => {
    _e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const _response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (_response.ok) {
        router.push(`/dashboard/orders/${orderId}`);
      } else {
        const errorData = await _response.json();
        setError(errorData.error || 'Failed to update order');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (__index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== __index)
      }));
    }
  };

  const updateItem = (__index: number, field: keyof OrderItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === __index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleProductChange = (__index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateItem(__index, 'product_id', productId);
      updateItem(__index, 'price', product.price);
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/orders/${orderId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Order
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Order #{orderId.substring(0, 8)}</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update order details and line items.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
                Contact *
              </label>
              <ContactAutocomplete
                value={formData.contact_id}
                onChange={(contactId, _contactName) => setFormData(prev => ({ ...prev, contact_id: contactId }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                placeholder="Search for a contact..."
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(_e) => setFormData(prev => ({ ...prev, status: _e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="order_date" className="block text-sm font-medium text-gray-700">
              Order Date *
            </label>
            <input
              type="date"
              id="order_date"
              required
              value={formData.order_date}
              onChange={(_e) => setFormData(prev => ({ ...prev, order_date: _e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
            />
          </div>

          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(_e) => setFormData(prev => ({ ...prev, notes: _e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Optional notes about this order..."
            />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, _index) => (
              <div key={_index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-md">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product *
                  </label>
                  <select
                    required
                    value={item.product_id}
                    onChange={(_e) => handleProductChange(_index, _e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(_e) => updateItem(_index, 'quantity', parseInt(_e.target.value) || 1)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={item.price}
                    onChange={(_e) => updateItem(_index, 'price', parseFloat(_e.target.value) || 0)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div className="flex items-end">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(_index)}
                      className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="text-lg font-semibold text-gray-900">
                Total: ${calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href={`/dashboard/orders/${orderId}`}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update Order' }
          </button>
        </div>
      </form>
    </div>
  );
}
