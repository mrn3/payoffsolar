'use client';

import React, { useState, useEffect } from 'react';
import {useParams} from 'next/navigation';
import {Product, ProductImage} from '@/lib/models';
import ImageUpload from '@/components/ui/ImageUpload';
import { FaArrowLeft } from 'react-icons/fa';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category_id: '',
    sku: '',
    is_active: true
  });
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
    fetchProductImages();
  }, [productId, fetchProduct, fetchProductImages]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const _response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        if (_response.status === 404) {
          setError('Product not found');
          return;
        }
        throw new Error('Failed to fetch product');
      }

            setProduct(_data.product);
      setFormData({
        name: data.product.name || '',
        description: data.product.description || '',
        price: data.product.price?.toString() || '',
        image_url: data.product.image_url || '',
        category_id: data.product.category_id || '',
        sku: data.product.sku || '',
        is_active: data.product.is_active
      });
    } catch (_error) {
      console.error('Error fetching product:', _error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const _response = await fetch('/api/product-categories');
      if (_response.ok) {
                setCategories(_data.categories);
      }
    } catch (_error) {
      console.error('Error fetching categories:', _error);
    }
  };

  const fetchProductImages = async () => {
    try {
      const _response = await fetch(`/api/products/${productId}/images`);
      if (_response.ok) {
                setProductImages(_data.images);
      }
    } catch (_error) {
      console.error('Error fetching product images:', _error);
    }
  };

  const handleImagesUploaded = async (uploadedFiles: unknown[]) => {
    try {
      // Add each uploaded image to the product
      for (const file of uploadedFiles) {
        await fetch(`/api/products/${productId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: file.url,
            alt_text: file.originalName
          })
        });
      }

      // Refresh the images list
      await fetchProductImages();
    } catch (_error) {
      console.error('Error adding images to product:', _error);
      setError('Failed to add images to product');
    }
  };

  const handleImageRemoved = async (imageUrl: string) => {
    try {
      // Find the image to remove
      const imageToRemove = productImages.find(img => img.image_url === imageUrl);
      if (!imageToRemove) return;

      const _response = await fetch(`/api/products/${productId}/images?imageId=${imageToRemove.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove image');
      }

      // Refresh the images list
      await fetchProductImages();
    } catch (_error) {
      console.error('Error removing image:', _error);
      setError('Failed to remove image');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    } else {
      const skuRegex = /^[A-Za-z0-9_-]+$/;
      if (!skuRegex.test(formData.sku)) {
        newErrors.sku = 'SKU can only contain letters, numbers, hyphens, and underscores';
      }
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Price must be a valid positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (_e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (_e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    
    // Validate individual field on blur
    const newErrors = { ...errors };
    
    if (name === 'name' && !formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (name === 'sku') {
      if (!formData.sku.trim()) {
        newErrors.sku = 'SKU is required';
      } else {
        const skuRegex = /^[A-Za-z0-9_-]+$/;
        if (!skuRegex.test(formData.sku)) {
          newErrors.sku = 'SKU can only contain letters, numbers, hyphens, and underscores';
        } else {
          delete newErrors.sku;
        }
      }
    } else if (name === 'price') {
      if (!formData.price.trim()) {
        newErrors.price = 'Price is required';
      } else {
        const price = parseFloat(formData.price);
        if (isNaN(price) || price < 0) {
          newErrors.price = 'Price must be a valid positive number';
        } else {
          delete newErrors.price;
        }
      }
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (_e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const _response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          category_id: formData.category_id || null,
          image_url: formData.image_url || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading product...</span>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update product information and settings.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.sku ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
                placeholder="e.g., SP-001"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price *</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-7 pr-3 py-2 border rounded-md ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-green-500 focus:border-green-500`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
              <ImageUpload
                onImagesUploaded={handleImagesUploaded}
                onImageRemoved={handleImageRemoved}
                existingImages={productImages.map(img => img.image_url)}
                maxImages={10}
                className="w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter product description"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active (product is available for sale)
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes' }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
