'use client';

import React, { useState, useEffect } from 'react';
import { ProductListingWithDetails } from '@/lib/models';
import { FaSync, FaExternalLinkAlt, FaCheck, FaTimes, FaSpinner, FaExclamationTriangle, FaEye, FaEdit } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface ListingStats {
  total: number;
  active: number;
  pending: number;
  error: number;
  ended: number;
}

export default function ListingStatusDashboard() {
  const router = useRouter();
  const [listings, setListings] = useState<ProductListingWithDetails[]>([]);
  const [stats, setStats] = useState<ListingStats>({
    total: 0,
    active: 0,
    pending: 0,
    error: 0,
    ended: 0
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/listing/all');
      const data = await response.json();
      const allListings = data.listings || [];
      
      setListings(allListings);
      
      // Calculate stats
      const newStats = allListings.reduce((acc: ListingStats, listing: ProductListingWithDetails) => {
        acc.total++;
        switch (listing.status) {
          case 'active':
            acc.active++;
            break;
          case 'pending':
            acc.pending++;
            break;
          case 'error':
            acc.error++;
            break;
          case 'ended':
            acc.ended++;
            break;
        }
        return acc;
      }, { total: 0, active: 0, pending: 0, error: 0, ended: 0 });
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/listing/sync-all', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync listings');
      }
      
      await fetchListings();
    } catch (error) {
      console.error('Error syncing listings:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FaCheck className="text-green-500" />;
      case 'pending':
        return <FaSpinner className="text-yellow-500" />;
      case 'error':
        return <FaTimes className="text-red-500" />;
      case 'ended':
        return <FaExclamationTriangle className="text-gray-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredListings = filter === 'all' 
    ? listings 
    : listings.filter(listing => listing.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-gray-500 mr-2" />
        <span>Loading listing status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Listing Status Dashboard</h2>
        <button
          onClick={handleSyncAll}
          disabled={syncing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {syncing ? (
            <FaSpinner className="animate-spin mr-2 h-4 w-4" />
          ) : (
            <FaSync className="mr-2 h-4 w-4" />
          )}
          Sync All Listings
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">{stats.total}</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaCheck className="w-8 h-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-lg font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaSpinner className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-lg font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaTimes className="w-8 h-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Errors</p>
              <p className="text-lg font-semibold text-gray-900">{stats.error}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="w-8 h-8 text-gray-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ended</p>
              <p className="text-lg font-semibold text-gray-900">{stats.ended}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'active', label: 'Active', count: stats.active },
            { key: 'pending', label: 'Pending', count: stats.pending },
            { key: 'error', label: 'Errors', count: stats.error },
            { key: 'ended', label: 'Ended', count: stats.ended }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Listings Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {listing.product_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {listing.product_sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{listing.platform_display_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(listing.status)}
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(listing.status)}`}>
                        {listing.status}
                      </span>
                    </div>
                    {listing.error_message && (
                      <div className="text-xs text-red-600 mt-1" title={listing.error_message}>
                        {listing.error_message.length > 50 
                          ? `${listing.error_message.substring(0, 50)}...`
                          : listing.error_message
                        }
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.last_sync_at 
                      ? new Date(listing.last_sync_at).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {listing.listing_url && (
                        <a
                          href={listing.listing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="View listing"
                        >
                          <FaExternalLinkAlt className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/products/${listing.product_id}`)}
                        className="text-green-600 hover:text-green-800"
                        title="View product"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/products/${listing.product_id}/edit`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit product"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No listings found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
