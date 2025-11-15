'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AffiliateCode } from '@/lib/models';
import { FaPlus, FaEdit, FaTrash, FaTag, FaEye, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import toast from 'react-hot-toast';

import Pagination from '@/components/ui/Pagination';
import { getGlobalPageSize, setGlobalPageSize } from '@/lib/paginationPrefs';


export default function AffiliateCodesPage() {
  const [affiliateCodes, setAffiliateCodes] = useState<AffiliateCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => getGlobalPageSize(10));


  useEffect(() => {
    fetchAffiliateCodes();
  }, []);

  // Clamp currentPage when data changes
  useEffect(() => {
    const tp = Math.max(1, Math.ceil(affiliateCodes.length / pageSize));
    if (currentPage > tp) setCurrentPage(tp);
  }, [affiliateCodes, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(affiliateCodes.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedAffiliateCodes = affiliateCodes.slice(startIndex, startIndex + pageSize);

  const fetchAffiliateCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/affiliate');
      if (response.ok) {
        const data = await response.json();
        setAffiliateCodes(data.affiliateCodes);
      } else {
        toast.error('Failed to load affiliate codes');
      }
    } catch (error) {

      console.error('Error fetching affiliate codes:', error);
      toast.error('Failed to load affiliate codes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete affiliate code "${code}"?`)) {
      return;
    }

    try {
      setDeleteLoading(id);
      const response = await fetch(`/api/affiliate/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Affiliate code deleted successfully');
        fetchAffiliateCodes();
      } else {
        toast.error('Failed to delete affiliate code');
      }
    } catch (error) {
      console.error('Error deleting affiliate code:', error);
      toast.error('Failed to delete affiliate code');
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/affiliate/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Affiliate code ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchAffiliateCodes();
      } else {
        toast.error('Failed to update affiliate code');
      }
    } catch (error) {
      console.error('Error updating affiliate code:', error);
      toast.error('Failed to update affiliate code');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : `$${value}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading affiliate codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Codes</h1>
          <p className="text-gray-600">Manage discount codes for affiliate partners</p>
        </div>
        <Link
          href="/dashboard/affiliate-codes/new"
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <FaPlus className="h-4 w-4" />
          <span>New Affiliate Code</span>
        </Link>
      </div>

      {/* Affiliate Codes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {affiliateCodes.length === 0 ? (
          <div className="text-center py-12">
            <FaTag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No affiliate codes</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first affiliate code.</p>
            <Link
              href="/dashboard/affiliate-codes/new"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors inline-flex items-center space-x-2"
            >
              <FaPlus className="h-4 w-4" />
              <span>Create Affiliate Code</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagedAffiliateCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaTag className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{code.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{code.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDiscount(code.discount_type, code.discount_value)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        {code.discount_type === 'percentage' ? 'off' : 'discount'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/orders/by-affiliate-code?affiliateCodeId=${code.id}`}
                        className="text-sm text-green-600 hover:text-green-900 hover:underline"
                      >
                        {code.usage_count}
                        {code.usage_limit && ` / ${code.usage_limit}`}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(code.id, code.is_active)}
                        className={`flex items-center space-x-1 ${
                          code.is_active ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {code.is_active ? (
                          <FaToggleOn className="h-5 w-5" />
                        ) : (
                          <FaToggleOff className="h-5 w-5" />
                        )}
                        <span className="text-sm">
                          {code.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {code.expires_at ? formatDate(code.expires_at) : 'Never'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/dashboard/affiliate-codes/${code.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/affiliate-codes/${code.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <FaEdit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(code.id, code.code)}
                          disabled={deleteLoading === code.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {affiliateCodes.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={affiliateCodes.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setCurrentPage(1); setPageSize(size); setGlobalPageSize(size); }}
          />
        </div>
      )}

    </div>
  );
}
