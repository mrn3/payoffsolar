'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ProductWithFirstImage } from '@/lib/models';
import { ProductDuplicateGroup, smartMergeProducts } from '@/lib/utils/duplicates';
import { FaTimes, FaExclamationTriangle, FaSync, FaCheck } from 'react-icons/fa';

interface DuplicateProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: () => void;
}

interface DuplicatesResponse {
  duplicateGroups: ProductDuplicateGroup[];
  totalGroups: number;
  totalDuplicateProducts: number;
}

export default function DuplicateProductsModal({ isOpen, onClose, onMergeComplete }: DuplicateProductsModalProps) {
  const [step, setStep] = useState<'loading' | 'list' | 'merge' | 'merging'>('loading');
  const [duplicateGroups, setDuplicateGroups] = useState<ProductDuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ProductDuplicateGroup | null>(null);
  const [primaryProduct, setPrimaryProduct] = useState<ProductWithFirstImage | null>(null);
  const [duplicateProduct, setDuplicateProduct] = useState<ProductWithFirstImage | null>(null);
  const [mergedData, setMergedData] = useState<Partial<ProductWithFirstImage>>({});
  const [threshold, setThreshold] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      findDuplicates();
    }
  }, [isOpen, threshold]);

  const findDuplicates = async () => {
    setStep('loading');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/duplicates?threshold=${threshold}`);
      if (!response.ok) {
        throw new Error('Failed to find duplicates');
      }

      const data: DuplicatesResponse = await response.json();
      setDuplicateGroups(data.duplicateGroups);
      setStep('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('list');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeGroup = (group: ProductDuplicateGroup) => {
    setSelectedGroup(group);
    // Set the first product as primary by default
    setPrimaryProduct(group.products[0]);
    setDuplicateProduct(group.products[1]);

    // Initialize merged data with smart merge logic
    const smartMerged = smartMergeProducts(group.products[0], group.products[1]);
    setMergedData({
      name: smartMerged.name,
      description: smartMerged.description,
      price: smartMerged.price,
      image_url: smartMerged.image_url,
      data_sheet_url: smartMerged.data_sheet_url,
      category_id: smartMerged.category_id,
      sku: smartMerged.sku,
      is_active: smartMerged.is_active
    });

    setStep('merge');
  };

  const handleMergeProducts = async () => {
    if (!primaryProduct || !duplicateProduct || !mergedData) return;

    setStep('merging');
    setLoading(true);

    try {
      const response = await fetch('/api/products/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryProductId: primaryProduct.id,
          duplicateProductId: duplicateProduct.id,
          mergedData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to merge products');
      }

      // Remove the merged group from the list
      setDuplicateGroups(prev => prev.filter(group => group.id !== selectedGroup?.id));
      
      // Reset state
      setSelectedGroup(null);
      setPrimaryProduct(null);
      setDuplicateProduct(null);
      setMergedData({});
      setStep('list');
      
      onMergeComplete();
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
      case 'name': return 'bg-blue-100 text-blue-800';
      case 'sku': return 'bg-green-100 text-green-800';
      case 'price': return 'bg-yellow-100 text-yellow-800';
      case 'description': return 'bg-indigo-100 text-indigo-800';
      case 'multiple': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Find and Merge Duplicate Products
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Step */}
        {step === 'loading' && (
          <div className="text-center py-8">
            <FaSync className="mx-auto h-8 w-8 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600">Scanning for duplicate products...</p>
          </div>
        )}

        {/* List Step */}
        {step === 'list' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  Similarity Threshold:
                </label>
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value={60}>60% - More matches</option>
                  <option value={70}>70% - Balanced</option>
                  <option value={80}>80% - Fewer matches</option>
                  <option value={90}>90% - Very strict</option>
                </select>
                <button
                  onClick={findDuplicates}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaSync className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {duplicateGroups.length === 0 ? (
              <div className="text-center py-8">
                <FaCheck className="mx-auto h-12 w-12 text-green-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h4>
                <p className="text-gray-600">
                  No potential duplicate products were found with the current threshold.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Found {duplicateGroups.length} potential duplicate groups affecting{' '}
                  {duplicateGroups.reduce((sum, group) => sum + group.products.length, 0)} products.
                </p>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {duplicateGroups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(group.matchType)}`}>
                            {group.matchType === 'multiple' ? 'Multiple matches' : `${group.matchType} match`}
                          </span>
                          <span className="text-sm text-gray-600">
                            {group.similarityScore}% similarity
                          </span>
                        </div>
                        <button
                          onClick={() => handleMergeGroup(group)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          Merge
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.products.map((product, index) => (
                          <div key={product.id} className="bg-gray-50 rounded-md p-3">
                            <h4 className="font-medium text-gray-900">
                              {product.name}
                            </h4>
                            <div className="mt-1 text-sm text-gray-900 space-y-1">
                              <p>SKU: {product.sku}</p>
                              <p>Price: {formatPrice(product.price)}</p>
                              <p>Category: {product.category_name || 'N/A'}</p>
                              <p>Status: {product.is_active ? 'Active' : 'Inactive'}</p>
                              <p>Created: {format(new Date(product.created_at), 'MMM d, yyyy')}</p>
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
                ← Back to duplicates list
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
                  <h5 className="font-medium text-red-900">Duplicate Product</h5>
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
