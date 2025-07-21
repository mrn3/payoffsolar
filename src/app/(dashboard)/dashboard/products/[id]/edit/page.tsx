'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, ProductImage, ProductCategory, ProductCostBreakdownWithCategory, CostCategory, ShippingMethod, Warehouse } from '@/lib/models';
import DragDropImageUpload from '@/components/ui/DragDropImageUpload';
import PDFUpload from '@/components/ui/PDFUpload';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ShippingMethodsEditor from '@/components/ui/ShippingMethodsEditor';
import BundleItemsManager from '@/components/products/BundleItemsManager';
import { generateProductSlug } from '@/lib/utils/slug';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';

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
    data_sheet_url: '',
    category_id: '',
    sku: '',
    slug: '',
    tax_percentage: '',
    shipping_methods: [] as ShippingMethod[],
    is_bundle: false,
    bundle_pricing_type: 'calculated' as 'calculated' | 'fixed',
    bundle_discount_percentage: '',
    is_active: true
  });
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [costBreakdowns, setCostBreakdowns] = useState<ProductCostBreakdownWithCategory[]>([]);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
    fetchCostCategories();
    fetchProductImages();
    fetchCostBreakdowns();
    fetchWarehouses();
  }, [productId]);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Product not found');
          return;
        }
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data.product);
      setFormData({
        name: data.product.name || '',
        description: data.product.description || '',
        price: data.product.price?.toString() || '',
        image_url: data.product.image_url || '',
        data_sheet_url: data.product.data_sheet_url || '',
        category_id: data.product.category_id || '',
        sku: data.product.sku || '',
        slug: data.product.slug || '',
        tax_percentage: data.product.tax_percentage?.toString() || '',
        shipping_methods: data.product.shipping_methods || [],
        is_bundle: data.product.is_bundle || false,
        bundle_pricing_type: data.product.bundle_pricing_type || 'calculated',
        bundle_discount_percentage: data.product.bundle_discount_percentage?.toString() || '',
        is_active: data.product.is_active
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/product-categories', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCostCategories = async () => {
    try {
      const response = await fetch('/api/cost-categories', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCostCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching cost categories:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchCostBreakdowns = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${productId}/cost-breakdowns`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCostBreakdowns(data.costBreakdowns);
      }
    } catch (error) {
      console.error('Error fetching cost breakdowns:', error);
    }
  }, [productId]);

  const fetchProductImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${productId}/images`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProductImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
    }
  }, [productId]);

  const handleImagesUploaded = async (uploadedFiles: Array<{
    originalName: string;
    filename: string;
    url: string;
    size: number;
    type: string;
  }>) => {
    try {
      // Add each uploaded image to the product
      for (const file of uploadedFiles) {
        const response = await fetch(`/api/products/${productId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            image_url: file.url,
            alt_text: file.originalName
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add image');
        }
      }

      // Refresh the images list
      await fetchProductImages();
    } catch (error) {
      console.error('Error adding images to product:', error);
      setError(error instanceof Error ? error.message : 'Failed to add images to product');
    }
  };

  const handleImageRemoved = async (imageUrl: string) => {
    try {
      // Find the image to remove
      const imageToRemove = productImages.find(img => img.image_url === imageUrl);
      if (!imageToRemove) return;

      const response = await fetch(`/api/products/${productId}/images?imageId=${imageToRemove.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to remove image');
      }

      // Refresh the images list
      await fetchProductImages();
    } catch (error) {
      console.error('Error removing image:', error);
      setError('Failed to remove image');
    }
  };

  const handleImageReordered = (reorderedImages: ProductImage[]) => {
    // Update the local state immediately for responsive UI
    setProductImages(reorderedImages);
  };

  const handlePDFUploaded = (file: { url: string; originalName: string }) => {
    setFormData(prev => ({ ...prev, data_sheet_url: file.url }));
  };

  const handlePDFRemoved = () => {
    setFormData(prev => ({ ...prev, data_sheet_url: '' }));
  };

  const addCostBreakdown = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/cost-breakdowns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category_id: costCategories[0]?.id || '',
          calculation_type: 'percentage',
          value: 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCostBreakdowns(data.costBreakdowns);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add cost breakdown');
      }
    } catch (error) {
      console.error('Error adding cost breakdown:', error);
      setError('Failed to add cost breakdown');
    }
  };

  const updateCostBreakdown = async (breakdownId: string, updates: Partial<ProductCostBreakdownWithCategory>) => {
    try {
      const response = await fetch(`/api/products/${productId}/cost-breakdowns/${breakdownId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setCostBreakdowns(data.costBreakdowns);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update cost breakdown');
      }
    } catch (error) {
      console.error('Error updating cost breakdown:', error);
      setError('Failed to update cost breakdown');
    }
  };

  const removeCostBreakdown = async (breakdownId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/cost-breakdowns/${breakdownId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCostBreakdowns(data.costBreakdowns);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove cost breakdown');
      }
    } catch (error) {
      console.error('Error removing cost breakdown:', error);
      setError('Failed to remove cost breakdown');
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
      const skuRegex = /^[A-Za-z0-9_*\-+./\s]+$/;
      if (!skuRegex.test(formData.sku)) {
        newErrors.sku = 'SKU can only contain letters, numbers, hyphens, underscores, asterisks, periods, plus signs, forward slashes, and spaces';
      }
    }

    if (formData.slug.trim()) {
      const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      if (!slugRegex.test(formData.slug)) {
        newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens (no spaces or special characters)';
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
      setFormData(prev => {
        const newData = { ...prev, [name]: value };

        // Auto-generate slug when name or SKU changes (only if slug is currently auto-generated)
        if ((name === 'name' || name === 'sku') && product) {
          const currentAutoSlug = generateProductSlug(prev.name, prev.sku);
          if (prev.slug === currentAutoSlug || !prev.slug) {
            const newName = name === 'name' ? value : prev.name;
            const newSku = name === 'sku' ? value : prev.sku;
            newData.slug = generateProductSlug(newName, newSku);
          }
        }

        return newData;
      });
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleShippingMethodsChange = (methods: ShippingMethod[]) => {
    setFormData(prev => ({ ...prev, shipping_methods: methods }));
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
    } else if (name === 'slug') {
      if (formData.slug.trim()) {
        const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
        if (!slugRegex.test(formData.slug)) {
          newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens (no spaces or special characters)';
        } else {
          delete newErrors.slug;
        }
      } else {
        delete newErrors.slug;
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

    setSaving(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
                placeholder="e.g., SP-001, SP*001"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">URL Slug</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                  errors.slug ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-green-500 focus:border-green-500`}
                placeholder="url-friendly-slug"
              />
              {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Used in SEO-friendly URLs. Auto-generated from product name and SKU.
              </p>
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

            <div className="sm:col-span-2">
              <ShippingMethodsEditor
                value={formData.shipping_methods}
                onChange={handleShippingMethodsChange}
                warehouses={warehouses}
              />
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
                existingImages={productImages}
                maxImages={10}
                className="w-full"
                productId={productId}
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

          {/* Cost Breakdown Section */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Default Cost Breakdown</h3>
                <p className="text-sm text-gray-500">
                  Define default cost categories that will be automatically applied to orders containing this product.
                </p>
              </div>
              <button
                type="button"
                onClick={addCostBreakdown}
                disabled={costCategories.length === 0}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Add Cost Category
              </button>
            </div>

            {costBreakdowns.length > 0 ? (
              <div className="space-y-4">
                {costBreakdowns.map((breakdown) => (
                  <div key={breakdown.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      <select
                        value={breakdown.category_id}
                        onChange={(e) => updateCostBreakdown(breakdown.id, { category_id: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                      >
                        <option value="">Select category</option>
                        {costCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Type *
                      </label>
                      <select
                        value={breakdown.calculation_type}
                        onChange={(e) => updateCostBreakdown(breakdown.id, { calculation_type: e.target.value as 'percentage' | 'fixed_amount' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed_amount">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Value *
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        {breakdown.calculation_type === 'percentage' && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        )}
                        {breakdown.calculation_type === 'fixed_amount' && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                        )}
                        <input
                          type="number"
                          step={breakdown.calculation_type === 'percentage' ? '0.01' : '0.01'}
                          min={breakdown.calculation_type === 'percentage' ? '-100' : undefined}
                          max={breakdown.calculation_type === 'percentage' ? '100' : undefined}
                          value={breakdown.value}
                          onChange={(e) => updateCostBreakdown(breakdown.id, { value: parseFloat(e.target.value) || 0 })}
                          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 ${
                            breakdown.calculation_type === 'fixed_amount' ? 'pl-7' : 'pr-7'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeCostBreakdown(breakdown.id)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-md">
                <p className="text-sm text-gray-500">
                  No cost breakdown categories defined. Click "Add Cost Category" to get started.
                </p>
              </div>
            )}
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

      {/* Bundle Items Management */}
      {formData.is_bundle && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Bundle Components</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage the products that make up this bundle.
            </p>
          </div>
          <div className="p-6">
            <BundleItemsManager
              bundleProductId={productId}
              onBundleChange={() => {
                // Optionally refresh product data when bundle changes
                fetchProduct();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
