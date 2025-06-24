'use client';

import React, { useState, useEffect } from 'react';
import { ProductWithImages, ListingPlatform, ProductListingWithDetails } from '@/lib/models';
import { FaPlus, FaSync, FaTrash, FaExternalLinkAlt, FaSpinner, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

interface ProductListingManagerProps {
  product: ProductWithImages;
  onListingUpdate?: () => void;
}

interface ListingStatus {
  platformId: string;
  platformName: string;
  status: 'not_listed' | 'active' | 'pending' | 'error' | 'ended';
  listingId?: string;
  listingUrl?: string;
  error?: string;
  lastSync?: string;
}

export default function ProductListingManager({ product, onListingUpdate }: ProductListingManagerProps) {
  const [platforms, setPlatforms] = useState<ListingPlatform[]>([]);
  const [listingStatuses, setListingStatuses] = useState<ListingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [product.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch platforms
      const platformsResponse = await fetch('/api/listing/platforms');
      const platformsData = await platformsResponse.json();
      setPlatforms(platformsData.platforms || []);

      // Fetch existing listings
      const listingsResponse = await fetch(`/api/listing/products/${product.id}`);
      const listingsData = await listingsResponse.json();
      const existingListings = listingsData.listings || [];

      // Create status array
      const statuses: ListingStatus[] = platformsData.platforms.map((platform: ListingPlatform) => {
        const existingListing = existingListings.find((l: ProductListingWithDetails) => l.platform_id === platform.id);
        
        if (existingListing) {
          return {
            platformId: platform.id,
            platformName: platform.display_name,
            status: existingListing.status as any,
            listingId: existingListing.external_listing_id,
            listingUrl: existingListing.listing_url,
            error: existingListing.error_message,
            lastSync: existingListing.last_sync_at
          };
        } else {
          return {
            platformId: platform.id,
            platformName: platform.display_name,
            status: 'not_listed'
          };
        }
      });

      setListingStatuses(statuses);
    } catch (error) {
      console.error('Error fetching listing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListings = async () => {
    if (selectedPlatforms.length === 0) return;

    try {
      setActionLoading({ create: true });

      console.log('Creating listings for platforms:', selectedPlatforms);

      const response = await fetch('/api/listing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          platformIds: selectedPlatforms
        })
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error('Failed to create listings');
      }

      const result = await response.json();
      console.log('Client received result:', result);

      // Show results and refresh data
      await fetchData();
      setShowCreateModal(false);
      setSelectedPlatforms([]);
      onListingUpdate?.();

    } catch (error) {
      console.error('Error creating listings:', error);
    } finally {
      setActionLoading({});
    }
  };

  const handleUpdateListing = async (platformId: string) => {
    try {
      setActionLoading({ [platformId]: true });
      
      const response = await fetch('/api/listing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          platformIds: [platformId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update listing');
      }

      await fetchData();
      onListingUpdate?.();
      
    } catch (error) {
      console.error('Error updating listing:', error);
    } finally {
      setActionLoading({});
    }
  };

  const handleDeleteListing = async (platformId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      setActionLoading({ [platformId]: true });
      
      const response = await fetch('/api/listing/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          platformIds: [platformId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete listing');
      }

      await fetchData();
      onListingUpdate?.();
      
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      setActionLoading({});
    }
  };

  const handleSyncAll = async () => {
    try {
      setActionLoading({ sync: true });
      
      const response = await fetch(`/api/listing/sync/${product.id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to sync listings');
      }

      await fetchData();
      onListingUpdate?.();
      
    } catch (error) {
      console.error('Error syncing listings:', error);
    } finally {
      setActionLoading({});
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FaCheck className="text-green-500" />;
      case 'pending':
        return <FaSpinner className="text-yellow-500 animate-spin" />;
      case 'error':
        return <FaTimes className="text-red-500" />;
      case 'ended':
        return <FaExclamationTriangle className="text-gray-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'error':
        return 'Error';
      case 'ended':
        return 'Ended';
      default:
        return 'Not Listed';
    }
  };

  const availablePlatforms = platforms.filter(p => 
    !listingStatuses.find(s => s.platformId === p.id && s.status !== 'not_listed' && s.status !== 'ended')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-gray-500 mr-2" />
        <span>Loading listing information...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Platform Listings</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleSyncAll}
            disabled={actionLoading.sync}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {actionLoading.sync ? (
              <FaSpinner className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <FaSync className="mr-2 h-4 w-4" />
            )}
            Sync All
          </button>
          {availablePlatforms.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Create Listings
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {listingStatuses.map((status) => (
          <div key={status.platformId} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.status)}
                <span className="font-medium text-gray-900">{status.platformName}</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                status.status === 'active' ? 'bg-green-100 text-green-800' :
                status.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                status.status === 'error' ? 'bg-red-100 text-red-800' :
                status.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                'bg-gray-100 text-gray-600'
              }`}>
                {getStatusText(status.status)}
              </span>
              {status.error && (
                <span className="text-sm text-red-700 font-medium" title={status.error}>
                  {status.error.length > 50 ? `${status.error.substring(0, 50)}...` : status.error}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {status.listingUrl && (
                <a
                  href={status.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900"
                  title="View listing"
                >
                  <FaExternalLinkAlt className="h-4 w-4" />
                </a>
              )}
              
              {status.status !== 'not_listed' && status.status !== 'ended' && (
                <>
                  <button
                    onClick={() => handleUpdateListing(status.platformId)}
                    disabled={actionLoading[status.platformId]}
                    className="text-blue-700 hover:text-blue-900 disabled:opacity-50"
                    title="Update listing"
                  >
                    {actionLoading[status.platformId] ? (
                      <FaSpinner className="animate-spin h-4 w-4" />
                    ) : (
                      <FaSync className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteListing(status.platformId)}
                    disabled={actionLoading[status.platformId]}
                    className="text-red-700 hover:text-red-900 disabled:opacity-50"
                    title="Delete listing"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Listings Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Listings</h3>
            
            <div className="space-y-3 mb-6">
              {availablePlatforms.map((platform) => (
                <label key={platform.id} className="flex items-center">
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
                  <span className="text-gray-900">{platform.display_name}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedPlatforms([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateListings}
                disabled={selectedPlatforms.length === 0 || actionLoading.create}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading.create ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  'Create Listings'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
