'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CostCategory } from '@/lib/models';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaTags } from 'react-icons/fa';
import Pagination from '@/components/ui/Pagination';


export default function CostCategoriesPage() {
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Clamp current page when categories change
  useEffect(() => {
    const tp = Math.max(1, Math.ceil(categories.length / pageSize));
    if (currentPage > tp) setCurrentPage(tp);
  }, [categories, currentPage]);

  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedCategories = categories.slice(startIndex, startIndex + pageSize);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchUsageStats();
  }, [showInactive]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cost-categories?includeInactive=${showInactive}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cost categories');
      }

      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/cost-categories?includeUsage=true');
      const data = await response.json();

      if (response.ok) {
        const stats: Record<string, number> = {};
        data.categories.forEach((cat: { id: string; usage_count: number }) => {
          stats[cat.id] = cat.usage_count;
        });
        setUsageStats(stats);
      }
    } catch (err) {
      // Don't show error for usage stats, just continue without them
      console.warn('Failed to fetch usage stats:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const usageCount = usageStats[id] || 0;
    let confirmMessage = 'Are you sure you want to delete this cost category? This action cannot be undone.';

    if (usageCount > 0) {
      confirmMessage = `This cost category is currently used in ${usageCount} cost item(s). Deleting it will remove all associated cost items. Are you sure you want to continue?`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/cost-categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete cost category');
      }

      // Refresh the list and usage stats
      await fetchCategories();
      await fetchUsageStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/cost-categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update cost category');
      }

      // Refresh the list
      await fetchCategories();
      await fetchUsageStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cost Categories</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage cost categories used in order cost breakdowns.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/cost-categories/create"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show inactive categories</span>
              </label>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <FaTags className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cost categories</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new cost category.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/cost-categories/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FaPlus className="mr-2 h-4 w-4" />
                  Add Category
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagedCategories.map((category) => (
                      <tr key={category.id} className={!category.is_active ? 'bg-gray-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {category.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {category.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {usageStats[category.id] > 0 ? (
                              <Link
                                href={`/dashboard/orders/by-cost-category?categoryId=${category.id}`}
                                className="text-green-600 hover:text-green-900 hover:underline"
                              >
                                {usageStats[category.id]} items
                              </Link>
                            ) : (
                              <span>{usageStats[category.id] || 0} items</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(category.id, category.is_active)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              category.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {category.is_active ? (
                              <>
                                <FaEye className="mr-1 h-3 w-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <FaEyeSlash className="mr-1 h-3 w-3" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(category.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/dashboard/cost-categories/${category.id}/edit`}
                              className="text-green-600 hover:text-green-900"
                            >
                              <FaEdit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(category.id)}
                              disabled={deletingId === category.id}
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

              {/* Mobile cards */}
              <div className="sm:hidden space-y-4">
                {pagedCategories.map((category) => (
                  <div key={category.id} className={`bg-white border border-gray-200 rounded-lg p-4 ${!category.is_active ? 'bg-gray-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {category.name}
                        </h3>
                        <div className="mt-2 space-y-2">
                          {category.description && (
                            <p className="text-sm text-gray-600">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              Usage: {usageStats[category.id] > 0 ? (
                                <Link
                                  href={`/dashboard/orders/by-cost-category?categoryId=${category.id}`}
                                  className="text-green-600 hover:text-green-900 hover:underline"
                                >
                                  {usageStats[category.id]} items
                                </Link>
                              ) : (
                                <span>{usageStats[category.id] || 0} items</span>
                              )}
                            </span>
                            <button
                              onClick={() => handleToggleActive(category.id, category.is_active)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                category.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {category.is_active ? (
                                <>
                                  <FaEye className="mr-1 h-3 w-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <FaEyeSlash className="mr-1 h-3 w-3" />
                                  Inactive
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(category.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <Link
                          href={`/dashboard/cost-categories/${category.id}/edit`}
                          className="text-green-600 hover:text-green-900 p-1"

                        >
                          <FaEdit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={deletingId === category.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {categories.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={categories.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setCurrentPage(1); setPageSize(size); }}
          />
        </div>
      )}

    </div>
  );
}
