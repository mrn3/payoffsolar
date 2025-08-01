'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DragDropImageUpload from '@/components/ui/DragDropImageUpload';
import PDFUpload from '@/components/ui/PDFUpload';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { FaArrowLeft } from 'react-icons/fa';
import { ProductImage, ProductCategory } from '@/lib/types';

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    data_sheet_url: '',
    category_id: '',
    sku: '',
    tax_percentage: '',
    is_bundle: false,
    bundle_pricing_type: 'calculated' as 'calculated' | 'fixed',
    bundle_discount_percentage: '',
    is_active: true
  });
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/product-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImagesUploaded = (uploadedFiles: { url: string; originalName: string }[]) => {
    const newImages = uploadedFiles.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`, // Temporary ID for new images
      product_id: '',
      image_url: file.url,
      alt_text: file.originalName,
      sort_order: uploadedImages.length + index,
      created_at: new Date().toISOString()
    }));
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleImageRemoved = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(img => img.image_url !== imageUrl));
  };

  const handleImageReordered = (reorderedImages: ProductImage[]) => {
    setUploadedImages(reorderedImages);
  };

  const handlePDFUploaded = (file: { url: string; originalName: string }) => {
    setFormData(prev => ({ ...prev, data_sheet_url: file.url }));
  };

  const handlePDFRemoved = () => {
    setFormData(prev => ({ ...prev, data_sheet_url: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    } else {
      const skuRegex = /^[A-Za-z0-9_*\-+./\s]+$/;
      if (!skuRegex.test(formData.sku)) {
        newErrors.sku = 'SKU can only contain letters, numbers, hyphens, underscores, asterisks, periods, plus signs, forward slashes, and spaces';
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

    if (formData.tax_percentage.trim()) {
      const taxPercentage = parseFloat(formData.tax_percentage);
      if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
        newErrors.tax_percentage = 'Tax percentage must be a valid number between 0 and 100';
      }
    }

    if (formData.bundle_discount_percentage.trim()) {
      const discountPercentage = parseFloat(formData.bundle_discount_percentage);
      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
        newErrors.bundle_discount_percentage = 'Bundle discount must be a valid number between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    
    // Validate individual field on blur
    const newErrors = { ...errors };
    
    if (name === 'name' && !formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (name === 'sku') {
      if (!formData.sku.trim()) {
        newErrors.sku = 'SKU is required';
      } else {
        const skuRegex = /^[A-Za-z0-9_*\-+./\s]+$/;
        if (!skuRegex.test(formData.sku)) {
          newErrors.sku = 'SKU can only contain letters, numbers, hyphens, underscores, asterisks, periods, plus signs, forward slashes, and spaces';
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
    } else if (name === 'tax_percentage') {
      if (formData.tax_percentage.trim()) {
        const taxPercentage = parseFloat(formData.tax_percentage);
        if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
          newErrors.tax_percentage = 'Tax percentage must be a valid number between 0 and 100';
        } else {
          delete newErrors.tax_percentage;
        }
      } else {
        delete newErrors.tax_percentage;
      }
    } else if (name === 'bundle_discount_percentage') {
      if (formData.bundle_discount_percentage.trim()) {
        const discountPercentage = parseFloat(formData.bundle_discount_percentage);
        if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
          newErrors.bundle_discount_percentage = 'Bundle discount must be a valid number between 0 and 100';
        } else {
          delete newErrors.bundle_discount_percentage;
        }
      } else {
        delete newErrors.bundle_discount_percentage;
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create the product first
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          tax_percentage: formData.tax_percentage ? parseFloat(formData.tax_percentage) : 0,
          bundle_discount_percentage: formData.bundle_discount_percentage ? parseFloat(formData.bundle_discount_percentage) : 0,
          category_id: formData.category_id || null,
          image_url: formData.image_url || null,
          data_sheet_url: formData.data_sheet_url || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const productData = await response.json();
      const productId = productData.product.id;

      // Add uploaded images to the product
      if (uploadedImages.length > 0) {
        for (let i = 0; i < uploadedImages.length; i++) {
          await fetch(`/api/products/${productId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: uploadedImages[i].image_url,
              alt_text: uploadedImages[i].alt_text || formData.name,
              sort_order: i
            })
          });
        }
      }

      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-semibold text-gray-900">Add New Product</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create a new product for your inventory.
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
                placeholder="e.g., SP-001, Q.Peak DUO BLK ML-G10+/t 395"
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
              <label className="block text-sm font-medium text-gray-700">Tax Percentage</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="tax_percentage"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_percentage}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-3 pr-12 py-2 border rounded-md ${
                    errors.tax_percentage ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-green-500 focus:border-green-500`}
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Leave empty for no tax (default: 0%)</p>
              {errors.tax_percentage && <p className="mt-1 text-sm text-red-600">{errors.tax_percentage}</p>}
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

            {/* Bundle Configuration */}
            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_bundle"
                  checked={formData.is_bundle}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">
                  This is a bundle product (composed of multiple products)
                </label>
              </div>
            </div>

            {formData.is_bundle && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bundle Pricing</label>
                  <select
                    name="bundle_pricing_type"
                    value={formData.bundle_pricing_type}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="calculated">Calculated from components</option>
                    <option value="fixed">Fixed price (override)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.bundle_pricing_type === 'calculated'
                      ? 'Price will be calculated from component products minus any discount'
                      : 'Use the fixed price entered above, ignoring component prices'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bundle Discount</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="bundle_discount_percentage"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.bundle_discount_percentage}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`block w-full pl-3 pr-12 py-2 border rounded-md ${
                        errors.bundle_discount_percentage ? 'border-red-300' : 'border-gray-300'
                      } focus:outline-none focus:ring-green-500 focus:border-green-500`}
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.bundle_pricing_type === 'calculated'
                      ? 'Percentage discount applied to total component price'
                      : 'This field is ignored when using fixed pricing'
                    }
                  </p>
                  {errors.bundle_discount_percentage && <p className="mt-1 text-sm text-red-600">{errors.bundle_discount_percentage}</p>}
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
              <DragDropImageUpload
                onImagesUploaded={handleImagesUploaded}
                onImageRemoved={handleImageRemoved}
                onImageReordered={handleImageReordered}
                existingImages={uploadedImages}
                maxImages={10}
                className="w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <PDFUpload
                onPDFUploaded={handlePDFUploaded}
                onPDFRemoved={handlePDFRemoved}
                existingPDF={formData.data_sheet_url}
                className="w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <div className="mt-1">
                <RichTextEditor
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter product description with rich formatting..."
                />
              </div>
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
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product' }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
