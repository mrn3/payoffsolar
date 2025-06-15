'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WarehouseFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface WarehouseFormProps {
  initialData?: Partial<WarehouseFormData>;
  warehouseId?: string;
  onSubmit?: (_data: WarehouseFormData) => void;
  onCancel?: () => void;
}

export default function WarehouseForm({ initialData, warehouseId, onSubmit, onCancel }: WarehouseFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    ...initialData
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Warehouse name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        onSubmit(formData);
        return;
      }

      const url = warehouseId ? `/api/warehouses/${warehouseId}` : '/api/warehouses';
      const method = warehouseId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/warehouses');
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'An error occurred' });
      }
    } catch (_error) {
      console.error('Error submitting form:', _error);
      setErrors({ submit: 'An error occurred while saving' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/dashboard/warehouses');
    }
  };

  const handleInputChange = (field: keyof WarehouseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInputBlur = (field: keyof WarehouseFormData) => {
    if (field === 'name' && !formData.name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Warehouse name is required' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Warehouse Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          onBlur={() => handleInputBlur('name')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 ${
            errors.name ? 'border-red-300' : ''
          }`}
          placeholder="Enter warehouse name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          type="text"
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
          placeholder="Enter street address"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
            placeholder="Enter city"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            State
          </label>
          <input
            type="text"
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
            placeholder="Enter state"
          />
        </div>

        <div>
          <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
            ZIP Code
          </label>
          <input
            type="text"
            id="zip"
            value={formData.zip}
            onChange={(e) => handleInputChange('zip', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
            placeholder="Enter ZIP code"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : warehouseId ? 'Update Warehouse' : 'Add Warehouse' }
        </button>
      </div>
    </form>
  );
}
