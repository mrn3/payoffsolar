'use client';

import React, { useState, useEffect } from 'react';
import {useParams} from 'next/navigation';
import {Product, ProductImage} from '@/lib/models';
import ImageCarousel from '@/components/ui/ImageCarousel';
import {FaArrowLeft, FaEdit} from 'react-icons/fa';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
    fetchProductImages();
  }, [productId, fetchProduct, fetchProductImages]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Product not found');
          return;
        }
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data.product);

      // Fetch category if product has one
      if (data.product.category_id) {
        fetchCategory(data.product.category_id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductImages = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/images`);
      if (response.ok) {
        const data = await response.json();
        setProductImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
    }
  };

  const fetchCategory = async (categoryId: string) => {
    try {
      const response = await fetch('/api/product-categories');
      if (response.ok) {
        const data = await response.json();
        const foundCategory = data.categories.find((cat: ProductCategory) => cat.id === categoryId);
        setCategory(foundCategory || null);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numPrice);
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

  if (!product) return null;

  // Prepare images for carousel (combine product_images and legacy image_url)
  const carouselImages = [
    ...productImages.map(img => img.image_url),
    ...(product.image_url && !productImages.some(img => img.image_url === product.image_url) ? [product.image_url] : [])
  ];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
            <p className="mt-1 text-sm text-gray-500">SKU: {product.sku}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Image Carousel */}
          <div>
            <ImageCarousel
              images={carouselImages}
              alt={product.name}
              className="h-96"
              showThumbnails={true}
              autoPlay={false}
            />
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Product Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</dd>
                </div>
                {category && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="text-sm text-gray-900">{category.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive' }
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(product.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(product.updated_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {product.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {productImages.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Images ({productImages.length})
                </h3>
                <p className="text-sm text-gray-500">
                  Use the carousel above to view all product images
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
