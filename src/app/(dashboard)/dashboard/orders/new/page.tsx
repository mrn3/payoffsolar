'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrderItem, Contact, Product } from '@/lib/types';
import ContactAutocomplete from '@/components/ui/ContactAutocomplete';
import ProductAutocomplete from '@/components/ui/ProductAutocomplete';
import {FaArrowLeft, FaPlus, FaTrash} from 'react-icons/fa';

// Local interface for form state that allows quantity to be string during editing
interface FormOrderItem {
  product_id: string;
  quantity: number | string;
  price: number | string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    contact_id: '',
    status: 'Proposed',
    order_date: new Date().toISOString().split('T')[0], // Default to today
    notes: '',
    items: [{ product_id: '', quantity: 1, price: 0 }] as FormOrderItem[]
  });

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Handle URL parameters for pre-populating contact
  useEffect(() => {
    const contactId = searchParams.get('contact_id');
    if (contactId && contacts.length > 0) {
      setFormData(prev => ({
        ...prev,
        contact_id: contactId
      }));
    }
  }, [searchParams, contacts]);

  const fetchData = async () => {
    try {
      const [contactsRes, productsRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/products')
      ]);

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.contacts || []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }
    } catch (err) {
      console.error('Error fetching _data:', err);
      setError('Failed to load contacts and products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (_e: React.FormEvent) => {
    _e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const _response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (_response.ok) {
        const _data = await _response.json();
        router.push(`/dashboard/orders/${_data.order.id}`);
      } else {
        const errorData = await _response.json();
        setError(errorData.error || 'Failed to create order');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to create order');
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

  const updateItem = (__index: number, field: keyof FormOrderItem, value: string | number) => {
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
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price;
      const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) || 0 : item.quantity;
      return total + (price * quantity);
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
          href="/dashboard/orders"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Order</h1>
        <p className="mt-2 text-sm text-gray-700">
          Add a new order with contact details and line items.
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
              >
                <option value="Cancelled">Cancelled</option>
                <option value="Complete">Complete</option>
                <option value="Paid">Paid</option>
                <option value="Proposed">Proposed</option>
                <option value="Scheduled">Scheduled</option>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
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
                  <ProductAutocomplete
                    value={item.product_id}
                    onChange={(productId, _productName) => handleProductChange(_index, productId)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                    placeholder="Search for a product..."
                    required
                  />
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
                    onChange={(_e) => {
                      const value = _e.target.value;
                      // Allow empty string during editing, convert to number on blur
                      if (value === '') {
                        updateItem(_index, 'quantity', '');
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          updateItem(_index, 'quantity', numValue);
                        }
                      }
                    }}
                    onBlur={(_e) => {
                      // Ensure we have a valid number when field loses focus
                      const value = _e.target.value;
                      if (value === '' || parseInt(value) < 1) {
                        updateItem(_index, 'quantity', 1);
                      }
                    }}
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
            href="/dashboard/orders"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Order' }
          </button>
        </div>
      </form>
    </div>
  );
}
