'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProductCategory } from '@/lib/models';
import { FaArrowLeft } from 'react-icons/fa';

export default function EditProductCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [parentCategories, setParentCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parent_id: '',
  });

  useEffect(() => {
    fetchCategory();
    fetchParentCategories();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/product-categories/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setCategory(data.category);
        setFormData({
          name: data.category.name,
          description: data.category.description || '',
          slug: data.category.slug,
          parent_id: data.category.parent_id || '',
        });
      } else {
        setError('Product category not found');
      }
    } catch (err) {
      console.error('Error fetching category:', err);
      setError('Failed to fetch product category');
    } finally {
      setLoading(false);
    }
  };

  const fetchParentCategories = async () => {
    try {
      const response = await fetch('/api/product-categories');
      if (response.ok) {
        const data = await response.json();
        // Filter out the current category to prevent circular references
        setParentCategories(data.categories.filter((cat: ProductCategory) => cat.id !== categoryId));
      }
    } catch (err) {
      console.error('Error fetching parent categories:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/product-categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          slug: formData.slug.trim(),
          parent_id: formData.parent_id || null
        }),
      });

      if (response.ok) {
        router.push('/dashboard/product-categories');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update product category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update product category');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error || 'Product category not found'}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/product-categories"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Product Categories
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Product Category</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update the details of this product category.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
              placeholder="e.g., Solar Panels, Inverters, Batteries"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
              placeholder="Optional description of this category"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              value={formData.slug}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
              placeholder="URL-friendly identifier"
            />
            <p className="mt-1 text-sm text-gray-500">
              Used in URLs. Should be unique and URL-friendly.
            </p>
          </div>

          <div>
            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
              Parent Category
            </label>
            <select
              id="parent_id"
              name="parent_id"
              value={formData.parent_id}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
            >
              <option value="">None (Top-level category)</option>
              {parentCategories.map((parentCategory) => (
                <option key={parentCategory.id} value={parentCategory.id}>
                  {parentCategory.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Optional: Select a parent category to create a subcategory.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/product-categories"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
