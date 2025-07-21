'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaCopy, FaSync } from 'react-icons/fa';
import { ProductWithFirstImage } from '@/lib/types';
import { format } from 'date-fns';

interface BulkMergeProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: string[];
  onComplete: () => void;
}

interface ProductDuplicateGroup {
  id: string;
  products: ProductWithFirstImage[];
  matchType: string;
  similarityScore: number;
}

export default function BulkMergeProductsModal({
  isOpen,
  onClose,
  selectedProductIds,
  onComplete
}: BulkMergeProductsModalProps) {
  const [step, setStep] = useState<'loading' | 'list' | 'merge' | 'merging'>('loading');
  const [duplicateGroups, setDuplicateGroups] = useState<ProductDuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ProductDuplicateGroup | null>(null);
  const [primaryProduct, setPrimaryProduct] = useState<ProductWithFirstImage | null>(null);
  const [duplicateProduct, setDuplicateProduct] = useState<ProductWithFirstImage | null>(null);
  const [mergedData, setMergedData] = useState<Partial<ProductWithFirstImage>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      findDuplicatesInSelection();
    }
  }, [isOpen, selectedProductIds]);

  const findDuplicatesInSelection = async () => {
    setStep('loading');
    setError(null);

    try {
      // First, try to find actual duplicates
      const response = await fetch('/api/products/bulk-find-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProductIds,
          threshold: 70
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find duplicates');
      }

      const data = await response.json();
      const foundDuplicates = data.duplicateGroups || [];

      // If no duplicates found but we have selected products, create merge groups anyway
      if (foundDuplicates.length === 0 && selectedProductIds.length >= 2) {
        // Fetch the selected products to create manual merge groups
        const productsResponse = await fetch('/api/products/bulk-get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: selectedProductIds })
        });

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const products = productsData.products || [];

          if (products.length >= 2) {
            // Create manual merge groups from selected products
            const manualGroups: ProductDuplicateGroup[] = [];
            for (let i = 0; i < products.length - 1; i += 2) {
              const groupProducts = products.slice(i, i + 2);
              if (groupProducts.length === 2) {
                manualGroups.push({
                  id: `manual-group-${i / 2 + 1}`,
                  products: groupProducts,
                  matchType: 'manual',
                  similarityScore: 0
                });
              }
            }

            // If there's an odd number of products, add the last one to the last group
            if (products.length % 2 === 1 && manualGroups.length > 0) {
              manualGroups[manualGroups.length - 1].products.push(products[products.length - 1]);
            }

            setDuplicateGroups(manualGroups);
          }
        }
      } else {
        setDuplicateGroups(foundDuplicates);
      }

      setStep('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('list');
    }
  };

  const handleMergeGroup = (group: ProductDuplicateGroup) => {
    setSelectedGroup(group);
    setPrimaryProduct(group.products[0]);
    setDuplicateProduct(group.products[1]);

    // Initialize merged data with primary product data, but merge in non-empty values from other products
    const mergedProductData = { ...group.products[0] };

    // For each field, use the first non-empty value found across all products
    for (let i = 1; i < group.products.length; i++) {
      const product = group.products[i];
      if (!mergedProductData.description && product.description) mergedProductData.description = product.description;
      if (!mergedProductData.image_url && product.image_url) mergedProductData.image_url = product.image_url;
      if (!mergedProductData.data_sheet_url && product.data_sheet_url) mergedProductData.data_sheet_url = product.data_sheet_url;
      if (!mergedProductData.category_id && product.category_id) mergedProductData.category_id = product.category_id;
    }

    setMergedData({
      name: mergedProductData.name,
      description: mergedProductData.description,
      price: mergedProductData.price,
      image_url: mergedProductData.image_url,
      data_sheet_url: mergedProductData.data_sheet_url,
      category_id: mergedProductData.category_id,
      sku: mergedProductData.sku,
      is_active: mergedProductData.is_active
    });

    setStep('merge');
  };

  const handleMergeProducts = async () => {
    if (!primaryProduct || !selectedGroup || !mergedData) return;

    setStep('merging');
    setLoading(true);

    try {
      // For groups with more than 2 products, merge all non-primary products into the primary one
      const productsToMerge = selectedGroup.products.filter(product => product.id !== primaryProduct.id);

      for (const productToMerge of productsToMerge) {
        const response = await fetch('/api/products/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primaryProductId: primaryProduct.id,
            duplicateProductId: productToMerge.id,
            mergedData
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to merge products');
        }
      }

      // Remove the merged group from the list
      setDuplicateGroups(prev => prev.filter(group => group.id !== selectedGroup?.id));

      // Reset state
      setSelectedGroup(null);
      setPrimaryProduct(null);
      setDuplicateProduct(null);
      setMergedData({});
      setStep('list');

      // If no more duplicates, complete the process
      if (duplicateGroups.length <= 1) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('merge');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('loading');
    setDuplicateGroups([]);
    setSelectedGroup(null);
    setPrimaryProduct(null);
    setDuplicateProduct(null);
    setMergedData({});
    setError(null);
    onClose();
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'name':
        return 'bg-blue-100 text-blue-800';
      case 'sku':
        return 'bg-green-100 text-green-800';
      case 'price':
        return 'bg-yellow-100 text-yellow-800';
      case 'description':
        return 'bg-indigo-100 text-indigo-800';
      case 'multiple':
        return 'bg-purple-100 text-purple-800';
      case 'manual':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Merge Duplicates in Selection
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500">Finding duplicates in selected products...</div>
          </div>
        )}

        {step === 'list' && (
          <div>
            {duplicateGroups.length === 0 ? (
              <div className="text-center py-8">
                <FaCopy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products to merge</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Unable to create merge groups from your selection.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {duplicateGroups[0]?.matchType === 'manual'
                    ? `Ready to merge ${duplicateGroups.length} group${duplicateGroups.length !== 1 ? 's' : ''} from your selection.`
                    : `Found ${duplicateGroups.length} duplicate group${duplicateGroups.length !== 1 ? 's' : ''} in your selection.`
                  }
                </p>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {duplicateGroups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(group.matchType)}`}>
                            {group.matchType === 'multiple' ? 'Multiple matches' :
                             group.matchType === 'manual' ? 'Manual merge' :
                             `${group.matchType} match`}
                          </span>
                          {group.matchType !== 'manual' && (
                            <span className="text-sm text-gray-600">
                              {group.similarityScore}% similarity
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleMergeGroup(group)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Merge
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.products.map((product, index) => (
                          <div key={product.id} className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <div className="mt-1 text-sm text-gray-600 space-y-1">
                              <div>SKU: {product.sku}</div>
                              <div>Price: {formatPrice(product.price)}</div>
                              {product.category_name && <div>Category: {product.category_name}</div>}
                              <div>Status: {product.is_active ? 'Active' : 'Inactive'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Merge Step */}
        {step === 'merge' && selectedGroup && primaryProduct && duplicateProduct && (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setStep('list')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to merge list
              </button>
            </div>

            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Merge Products
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Product */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-green-900">Primary Product</h5>
                  <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                    Will be kept
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-900">
                  <p><strong>Name:</strong> {primaryProduct.name}</p>
                  <p><strong>SKU:</strong> {primaryProduct.sku}</p>
                  <p><strong>Price:</strong> {formatPrice(primaryProduct.price)}</p>
                  <p><strong>Category:</strong> {primaryProduct.category_name || 'N/A'}</p>
                  <p><strong>Status:</strong> {primaryProduct.is_active ? 'Active' : 'Inactive'}</p>
                  <p><strong>Created:</strong> {format(new Date(primaryProduct.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {/* Duplicate Product */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-red-900">Product to Merge</h5>
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                    Will be deleted
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-900">
                  <p><strong>Name:</strong> {duplicateProduct.name}</p>
                  <p><strong>SKU:</strong> {duplicateProduct.sku}</p>
                  <p><strong>Price:</strong> {formatPrice(duplicateProduct.price)}</p>
                  <p><strong>Category:</strong> {duplicateProduct.category_name || 'N/A'}</p>
                  <p><strong>Status:</strong> {duplicateProduct.is_active ? 'Active' : 'Inactive'}</p>
                  <p><strong>Created:</strong> {format(new Date(duplicateProduct.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {/* Merged Result */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-3">Merged Product Data</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={mergedData.name || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={mergedData.sku || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={mergedData.price || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={mergedData.description || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={mergedData.image_url || ''}
                      onChange={(e) => setMergedData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mergedData.is_active || false}
                        onChange={(e) => setMergedData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-xs text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setStep('list')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeProducts}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Merge Products
              </button>
            </div>
          </div>
        )}

        {/* Merging Step */}
        {step === 'merging' && (
          <div className="text-center py-8">
            <FaSync className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600">Merging products...</p>
          </div>
        )}
      </div>
    </div>
  );
}
