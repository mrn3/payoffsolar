'use client';

import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaBox, FaDollarSign } from 'react-icons/fa';
import { ProductWithFirstImage, ProductBundleItemWithProduct } from '@/lib/types';

interface BundleItemsManagerProps {
  bundleProductId: string;
  onBundleChange?: () => void;
}

interface BundlePricing {
  componentCount: number;
  totalComponentPrice: number;
  discountPercentage: number;
  discountAmount: number;
  calculatedPrice: number;
  finalPrice: number;
  pricingType: 'calculated' | 'fixed';
  savings: number;
}

export default function BundleItemsManager({ bundleProductId, onBundleChange }: BundleItemsManagerProps) {
  const [bundleItems, setBundleItems] = useState<ProductBundleItemWithProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductWithFirstImage[]>([]);
  const [pricing, setPricing] = useState<BundlePricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);

  useEffect(() => {
    fetchBundleData();
    fetchAvailableProducts();
  }, [bundleProductId]);

  const fetchBundleData = async () => {
    try {
      const response = await fetch(`/api/products/${bundleProductId}/bundle-pricing`);
      if (response.ok) {
        const data = await response.json();
        setBundleItems(data.bundleItems);
        setPricing(data.pricing);
      }
    } catch (error) {
      console.error('Error fetching bundle data:', error);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=1000');
      if (response.ok) {
        const data = await response.json();
        // Filter out the current bundle and any bundles to prevent circular dependencies
        const filtered = data.products.filter((p: ProductWithFirstImage) => 
          p.id !== bundleProductId && !p.is_bundle
        );
        setAvailableProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedProductId || quantity <= 0) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${bundleProductId}/bundle-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component_product_id: selectedProductId,
          quantity: quantity
        })
      });

      if (response.ok) {
        await fetchBundleData();
        setShowAddModal(false);
        setSelectedProductId('');
        setQuantity(1);
        onBundleChange?.();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add component');
      }
    } catch (error) {
      console.error('Error adding bundle item:', error);
      alert('Failed to add component');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string) => {
    if (editQuantity <= 0) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/bundle-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: editQuantity })
      });

      if (response.ok) {
        await fetchBundleData();
        setEditingItem(null);
        onBundleChange?.();
      } else {
        alert('Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this component from the bundle?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/bundle-items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchBundleData();
        onBundleChange?.();
      } else {
        alert('Failed to remove component');
      }
    } catch (error) {
      console.error('Error removing bundle item:', error);
      alert('Failed to remove component');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bundle Pricing Summary */}
      {pricing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-800 mb-3 flex items-center">
            <FaDollarSign className="mr-2" />
            Bundle Pricing Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-600 font-medium">Components:</span>
              <div className="text-green-800">{pricing.componentCount} items</div>
            </div>
            <div>
              <span className="text-green-600 font-medium">Total Component Price:</span>
              <div className="text-green-800">${pricing.totalComponentPrice.toFixed(2)}</div>
            </div>
            {pricing.pricingType === 'calculated' && pricing.discountPercentage > 0 && (
              <div>
                <span className="text-green-600 font-medium">Discount ({pricing.discountPercentage}%):</span>
                <div className="text-green-800">-${pricing.discountAmount.toFixed(2)}</div>
              </div>
            )}
            <div>
              <span className="text-green-600 font-medium">Final Price:</span>
              <div className="text-green-800 font-bold">${pricing.finalPrice.toFixed(2)}</div>
            </div>
          </div>
          {pricing.savings > 0 && (
            <div className="mt-2 text-sm text-green-700">
              Customer saves ${pricing.savings.toFixed(2)} with this bundle!
            </div>
          )}
        </div>
      )}

      {/* Bundle Items List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FaBox className="mr-2" />
            Bundle Components ({bundleItems.length})
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 flex items-center"
          >
            <FaPlus className="mr-1" />
            Add Component
          </button>
        </div>

        {bundleItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaBox className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No components added to this bundle yet.</p>
            <p className="text-sm">Click "Add Component" to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bundleItems.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {item.component_product_image_url && (
                    <img
                      src={item.component_product_image_url}
                      alt={item.component_product_name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{item.component_product_name}</h4>
                    <p className="text-sm text-gray-500">{item.component_product_sku}</p>
                    <p className="text-sm text-gray-600">${item.component_product_price?.toFixed(2)} each</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {editingItem === item.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id)}
                          disabled={loading}
                          className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        <button
                          onClick={() => {
                            setEditingItem(item.id);
                            setEditQuantity(item.quantity);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-sm font-medium text-gray-900">
                    ${((item.component_product_price || 0) * item.quantity).toFixed(2)}
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Component Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Bundle Component</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select a product</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - ${product.price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={loading || !selectedProductId}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Component'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
