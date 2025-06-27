'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AffiliateCode } from '@/lib/models';
import { FaArrowLeft, FaEdit, FaTag, FaCalendar, FaUsers, FaChartLine, FaCopy } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function AffiliateCodeDetailPage() {
  const params = useParams();
  const [affiliateCode, setAffiliateCode] = useState<AffiliateCode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAffiliateCode(params.id as string);
    }
  }, [params.id]);

  const fetchAffiliateCode = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/affiliate/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAffiliateCode(data.affiliateCode);
      } else {
        toast.error('Failed to load affiliate code');
      }
    } catch (error) {
      console.error('Error fetching affiliate code:', error);
      toast.error('Failed to load affiliate code');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : `$${value}`;
  };

  const copyAffiliateLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const affiliateLink = `${baseUrl}/products?ref=${affiliateCode?.code}`;
    navigator.clipboard.writeText(affiliateLink);
    toast.success('Affiliate link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading affiliate code...</p>
        </div>
      </div>
    );
  }

  if (!affiliateCode) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Affiliate Code Not Found</h1>
        <p className="text-gray-600 mb-6">The affiliate code you're looking for doesn't exist.</p>
        <Link
          href="/dashboard/affiliate-codes"
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
        >
          Back to Affiliate Codes
        </Link>
      </div>
    );
  }

  const usagePercentage = affiliateCode.usage_limit 
    ? (affiliateCode.usage_count / affiliateCode.usage_limit) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/affiliate-codes"
            className="text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaTag className="h-6 w-6 text-green-500" />
              {affiliateCode.code}
            </h1>
            <p className="text-gray-600">{affiliateCode.name || 'Affiliate Code Details'}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/affiliate-codes/${affiliateCode.id}/edit`}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <FaEdit className="h-4 w-4" />
          <span>Edit</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaTag className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Discount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDiscount(affiliateCode.discount_type, affiliateCode.discount_value)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaUsers className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Uses</p>
              <p className="text-2xl font-bold text-gray-900">{affiliateCode.usage_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaChartLine className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usage Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                {affiliateCode.usage_limit || 'Unlimited'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaCalendar className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className={`text-2xl font-bold ${affiliateCode.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {affiliateCode.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Code Details</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Code</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                {affiliateCode.code}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Display Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{affiliateCode.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Discount Type</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {affiliateCode.discount_type.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Discount Value</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDiscount(affiliateCode.discount_type, affiliateCode.discount_value)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(affiliateCode.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(affiliateCode.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Expires</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {affiliateCode.expires_at ? formatDate(affiliateCode.expires_at) : 'Never'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Usage Progress</dt>
              <dd className="mt-1">
                {affiliateCode.usage_limit ? (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{affiliateCode.usage_count} / {affiliateCode.usage_limit}</span>
                      <span>{Math.round(usagePercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-900">{affiliateCode.usage_count} uses (unlimited)</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Affiliate Link */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Affiliate Link</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-3">
            Share this link to automatically apply the affiliate code:
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800">
              {process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/products?ref={affiliateCode.code}
            </code>
            <button
              onClick={copyAffiliateLink}
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors flex items-center space-x-1"
            >
              <FaCopy className="h-4 w-4" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
