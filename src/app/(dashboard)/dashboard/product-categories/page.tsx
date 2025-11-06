'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCategory } from '@/lib/types';
import { FaPlus, FaEdit, FaTrash, FaTags } from 'react-icons/fa';

import Pagination from '@/components/ui/Pagination';

interface ProductCategoryWithUsage extends ProductCategory {
  product_count?: number;
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategoryWithUsage[]>([]);
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Clamp currentPage when categories change
  useEffect(() => {
    const tp = Math.max(1, Math.ceil(categories.length / pageSize));
    if (currentPage > tp) setCurrentPage(tp);
  }, [categories, currentPage]);

  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedCategories = categories.slice(startIndex, startIndex + pageSize);

  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchUsageStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/product-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      } else {
        setError('Failed to fetch product categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch product categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/product-categories?includeUsage=true');
      if (response.ok) {
        const data = await response.json();
        const stats: Record<string, number> = {};
        data.categories.forEach((cat: ProductCategoryWithUsage) => {
          stats[cat.id] = cat.product_count || 0;
        });
        setUsageStats(stats);
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product category? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/product-categories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCategories();
        await fetchUsageStats();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete product category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete product category');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Product Categories</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage product categories to organize your inventory.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/product-categories/create"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <FaTags className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No product categories</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new product category.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/product-categories/create"
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
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
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
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {category.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{category.slug}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {usageStats[category.id] || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(category.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/dashboard/product-categories/${category.id}/edit`}
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
              <div className="sm:hidden">
                {pagedCategories.map((category) => (
                  <div key={category.id} className="border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-500">{category.description || 'No description'}</p>
                          <p className="text-xs text-gray-400 mt-1">Slug: {category.slug}</p>
                          <p className="text-xs text-gray-400">Products: {usageStats[category.id] || 0}</p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(category.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <Link
                          href={`/dashboard/product-categories/${category.id}/edit`}
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
          />
        </div>
      )}

    </div>
  );
}
