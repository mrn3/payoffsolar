'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { Customer } from '@/lib/models';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Customer not found');
          return;
        }
        throw new Error('Failed to fetch customer');
      }

      const data = await response.json();
      setCustomer(data.customer);
      setFormData({
        first_name: data.customer.first_name || '',
        last_name: data.customer.last_name || '',
        email: data.customer.email || '',
        phone: data.customer.phone || '',
        address: data.customer.address || '',
        city: data.customer.city || '',
        state: data.customer.state || '',
        zip: data.customer.zip || '',
        notes: data.customer.notes || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';

    // Email validation (only if email is provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update customer');
      }

      router.push('/dashboard/customers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/customers')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/dashboard/customers')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </button>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit Customer: {customer?.first_name} {customer?.last_name}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Update customer information and contact details.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-gray-900 ${
                  errors.first_name ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
              />
              {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-gray-900 ${
                  errors.last_name ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
              />
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-gray-900 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-gray-900 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-gray-900 ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-gray-900 ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-gray-900 ${
                  errors.state ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
              />
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-gray-900 ${
                  errors.zip ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
              />
              {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Additional notes about this customer..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/customers')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <FaSave className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
