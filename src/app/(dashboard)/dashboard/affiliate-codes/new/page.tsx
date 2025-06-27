'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface FormData {
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: string;
  is_active: boolean;
  expires_at: string;
  usage_limit: string;
}

export default function NewAffiliateCodePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    discount_type: 'percentage',
    discount_value: '',
    is_active: true,
    expires_at: '',
    usage_limit: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast.error('Affiliate code is required');
      return;
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim() || null,
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          is_active: formData.is_active,
          expires_at: formData.expires_at || null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        }),
      });

      if (response.ok) {
        toast.success('Affiliate code created successfully');
        router.push('/dashboard/affiliate-codes');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create affiliate code');
      }
    } catch (error) {
      console.error('Error creating affiliate code:', error);
      toast.error('Failed to create affiliate code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/affiliate-codes"
          className="text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Affiliate Code</h1>
          <p className="text-gray-600">Add a new discount code for affiliate partners</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Affiliate Code *
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., SAVE20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Code will be automatically converted to uppercase
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., 20% Off Everything"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Discount Type */}
            <div>
              <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type *
              </label>
              <select
                id="discount_type"
                name="discount_type"
                value={formData.discount_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 mb-2">
                Discount Value *
              </label>
              <div className="relative">
                {formData.discount_type === 'fixed_amount' && (
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                )}
                <input
                  type="number"
                  id="discount_value"
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleInputChange}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '50.00'}
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formData.discount_type === 'fixed_amount' ? 'pl-8' : ''
                  }`}
                  required
                />
                {formData.discount_type === 'percentage' && (
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                )}
              </div>
            </div>

            {/* Expires At */}
            <div>
              <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date
              </label>
              <input
                type="datetime-local"
                id="expires_at"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for no expiration
              </p>
            </div>

            {/* Usage Limit */}
            <div>
              <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                id="usage_limit"
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleInputChange}
                placeholder="100"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for unlimited usage
              </p>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active (code can be used immediately)
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/dashboard/affiliate-codes"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <FaSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <FaSave className="h-4 w-4" />
              )}
              <span>{loading ? 'Creating...' : 'Create Affiliate Code'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
