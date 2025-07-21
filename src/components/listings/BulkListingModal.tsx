'use client';

import React, { useState, useEffect } from 'react';
import { ProductWithFirstImage, ListingPlatform } from '@/lib/types';
import { FaSpinner, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface BulkListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: ProductWithFirstImage[];
  onComplete: () => void;
}

interface BulkListingResult {
  productId: string;
  productName: string;
  results: Array<{
    platformId: string;
    platformName: string;
    success: boolean;
    error?: string;
    warnings?: string[];
  }>;
}

export default function BulkListingModal({ 
  isOpen, 
  onClose, 
  selectedProducts, 
  onComplete 
}: BulkListingModalProps) {
  const [platforms, setPlatforms] = useState<ListingPlatform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkListingResult[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'processing' | 'results'>('select');

  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
      setCurrentStep('select');
      setResults([]);
      setSelectedPlatforms([]);
    }
  }, [isOpen]);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/listing/platforms?active=true');
      const data = await response.json();
      setPlatforms(data.platforms || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  const handleCreateListings = async () => {
    if (selectedPlatforms.length === 0 || selectedProducts.length === 0) return;

    setLoading(true);
    setCurrentStep('processing');
    const newResults: BulkListingResult[] = [];

    for (const product of selectedProducts) {
      try {
        const response = await fetch('/api/listing/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            platformIds: selectedPlatforms
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create listings');
        }

        const data = await response.json();
        newResults.push({
          productId: product.id,
          productName: product.name,
          results: data.result.results
        });

      } catch (error) {
        console.error(`Error creating listings for product ${product.name}:`, error);
        newResults.push({
          productId: product.id,
          productName: product.name,
          results: selectedPlatforms.map(platformId => {
            const platform = platforms.find(p => p.id === platformId);
            return {
              platformId,
              platformName: platform?.display_name || 'Unknown',
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          })
        });
      }
    }

    setResults(newResults);
    setCurrentStep('results');
    setLoading(false);
  };

  const handleClose = () => {
    if (currentStep === 'results') {
      onComplete();
    }
    onClose();
  };

  const getResultIcon = (success: boolean, error?: string) => {
    if (success) {
      return <FaCheck className="text-green-500" />;
    } else if (error) {
      return <FaTimes className="text-red-500" />;
    } else {
      return <FaExclamationTriangle className="text-yellow-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Create Listings ({selectedProducts.length} products)
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {currentStep === 'select' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Platforms</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {platforms.map((platform) => (
                  <label key={platform.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform.id]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(id => id !== platform.id));
                        }
                      }}
                      className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium">{platform.display_name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Products</h3>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex items-center p-3 border-b last:border-b-0">
                    {product.first_image_url && (
                      <img
                        src={product.first_image_url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded mr-3"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateListings}
                disabled={selectedPlatforms.length === 0}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                Create Listings
              </button>
            </div>
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="text-center py-12">
            <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Listings...</h3>
            <p className="text-gray-600">
              Processing {selectedProducts.length} products across {selectedPlatforms.length} platforms
            </p>
          </div>
        )}

        {currentStep === 'results' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Listing Results</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div key={result.productId} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{result.productName}</h4>
                  <div className="space-y-2">
                    {result.results.map((platformResult) => (
                      <div key={platformResult.platformId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          {getResultIcon(platformResult.success, platformResult.error)}
                          <span className="text-sm font-medium">{platformResult.platformName}</span>
                        </div>
                        <div className="text-sm">
                          {platformResult.success ? (
                            <span className="text-green-600">Success</span>
                          ) : (
                            <span className="text-red-600" title={platformResult.error}>
                              {platformResult.error && platformResult.error.length > 30 
                                ? `${platformResult.error.substring(0, 30)}...`
                                : platformResult.error || 'Failed'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
