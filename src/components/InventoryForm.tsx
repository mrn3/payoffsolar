'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface InventoryFormData {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  min_quantity: number;
}

interface InventoryFormProps {
  initialData?: InventoryFormData;
  inventoryId?: string;
  onSubmit?: (_data: InventoryFormData) => void;
  onCancel?: () => void;
}

export default function InventoryForm({ initialData, inventoryId, onSubmit, onCancel }: InventoryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<InventoryFormData>({
    product_id: '',
    warehouse_id: '',
    quantity: 0,
    min_quantity: 0,
    ...initialData
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProducts();
    loadWarehouses();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const loadProducts = async () => {
    try {
      const _response = await fetch('/api/products?includeInactive=false&limit=1000', {
        credentials: 'include'
      });
      if (_response.ok) {
                setProducts(_data.products || []);
      }
    } catch (_error) {
      console.error('Error loading products:', _error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const _response = await fetch('/api/warehouses', {
        credentials: 'include'
      });
      if (_response.ok) {
                setWarehouses(_data.warehouses || []);
      }
    } catch (_error) {
      console.error('Error loading warehouses:', _error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Product is required';
    }
    if (!formData.warehouse_id) {
      newErrors.warehouse_id = 'Warehouse is required';
    }
    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity must be non-negative';
    }
    if (formData.min_quantity < 0) {
      newErrors.min_quantity = 'Minimum quantity must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (_e: React.FormEvent) => {
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

      const url = inventoryId ? `/api/inventory/${inventoryId}` : '/api/inventory';
      const method = inventoryId ? 'PUT' : 'POST';

      const _response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (_response.ok) {
        router.push('/dashboard/inventory');
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
      router.push('/dashboard/inventory');
    }
  };

  const handleInputChange = (field: keyof InventoryFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
        <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
          Product *
        </label>
        <select
          id="product_id"
          value={formData.product_id}
          onChange={(_e) => handleInputChange('product_id', _e.target.value)}
          disabled={!!inventoryId} // Don&apos;t allow changing product for existing inventory
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 ${
            errors.product_id ? 'border-red-300' : ''
          }`}
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.sku})
            </option>
          ))}
        </select>
        {errors.product_id && <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>}
      </div>

      <div>
        <label htmlFor="warehouse_id" className="block text-sm font-medium text-gray-700">
          Warehouse *
        </label>
        <select
          id="warehouse_id"
          value={formData.warehouse_id}
          onChange={(_e) => handleInputChange('warehouse_id', _e.target.value)}
          disabled={!!inventoryId} // Don&apos;t allow changing warehouse for existing inventory
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 ${
            errors.warehouse_id ? 'border-red-300' : ''
          }`}
        >
          <option value="">Select a warehouse</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>
        {errors.warehouse_id && <p className="mt-1 text-sm text-red-600">{errors.warehouse_id}</p>}
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          Current Quantity *
        </label>
        <input
          type="number"
          id="quantity"
          min="0"
          value={formData.quantity}
          onChange={(_e) => handleInputChange('quantity', parseInt(_e.target.value) || 0)}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 ${
            errors.quantity ? 'border-red-300' : ''
          }`}
        />
        {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
      </div>

      <div>
        <label htmlFor="min_quantity" className="block text-sm font-medium text-gray-700">
          Minimum Quantity *
        </label>
        <input
          type="number"
          id="min_quantity"
          min="0"
          value={formData.min_quantity}
          onChange={(_e) => handleInputChange('min_quantity', parseInt(_e.target.value) || 0)}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 ${
            errors.min_quantity ? 'border-red-300' : ''
          }`}
        />
        {errors.min_quantity && <p className="mt-1 text-sm text-red-600">{errors.min_quantity}</p>}
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
          {loading ? 'Saving...' : inventoryId ? 'Update Inventory' : 'Add Inventory' }
        </button>
      </div>
    </form>
  );
}
