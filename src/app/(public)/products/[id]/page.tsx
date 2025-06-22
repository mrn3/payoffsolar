'use client';

import React, { useState, useEffect } from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {Product, ProductImage} from '@/lib/models';
import ImageCarousel from '@/components/ui/ImageCarousel';
import Breadcrumb from '@/components/ui/Breadcrumb';
import RelatedProducts from '@/components/products/RelatedProducts';
import { useCart } from '@/contexts/CartContext';
import {FaArrowLeft, FaImage, FaMinus, FaPlus, FaShoppingCart, FaSpinner, FaFilePdf, FaDownload} from 'react-icons/fa';

interface ProductWithDetails extends Product {
  category_name?: string;
  images?: ProductImage[];
}

export default function ProductDetailPage() {
  const params = useParams();
    const { addItem } = useCart();

  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (_id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch product details
      const productResponse = await fetch(`/api/public/products/${_id}`);
      if (!productResponse.ok) {
        if (productResponse.status === 404) {
          setError('Product not found');
        } else {
          setError('Failed to load product');
        }
        return;
      }

      const productData = await productResponse.json();
      setProduct(productData.product);
    } catch (_error) {
      console.error('Error fetching product:', _error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleAddToCart = () => {
    if (product) {
      addItem({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        product_price: product.price,
        product_image_url: product.images?.[0]?.image_url,
      }, quantity);
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <FaSpinner className="h-8 w-8 text-green-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading product...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Product not found'}
          </h1>
          <p className="text-gray-600 mb-6">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/products"
            className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Products', href: '/products' },
            { label: product.name }
          ]}
          className="mb-6"
        />

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
          >
            <FaArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div>
              {product.images && product.images.length > 0 ? (
                <ImageCarousel images={product.images} />
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <FaImage className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div>
              <div className="mb-4">
                {product.category_name && (
                  <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full mb-2">
                    {product.category_name}
                  </span>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <div className="prose prose-gray max-w-none">
                  <div
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description || '' }}
                  />
                </div>
              </div>

              {/* Data Sheet Section */}
              {product.data_sheet_url && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Sheet</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <FaFilePdf className="text-red-500 text-xl" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Product Data Sheet
                          </p>
                          <p className="text-xs text-gray-500">PDF Document</p>
                        </div>
                      </div>
                      <a
                        href={product.data_sheet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <FaDownload className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </div>

                    {/* PDF Viewer */}
                    <div className="w-full h-96 border border-gray-300 rounded-md overflow-hidden">
                      <iframe
                        src={`${product.data_sheet_url}#toolbar=1&navpanes=0&scrollbar=1`}
                        className="w-full h-full"
                        title="Product Data Sheet"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={decrementQuantity}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <FaMinus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <FaPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.is_active}
                  className="w-full bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors font-medium flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <FaShoppingCart className="h-5 w-5" />
                  <span>Add to Cart</span>
                </button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/contact"
                    className="bg-white text-green-500 border border-green-500 px-4 py-2 rounded-md hover:bg-green-50 transition-colors text-center block font-medium"
                  >
                    Get Quote
                  </Link>
                  <Link
                    href="/contact"
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-center block font-medium"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>

              {/* Product Status */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'Available' : 'Unavailable' }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <RelatedProducts
          currentProductId={product.id}
          categoryId={product.category_id}
        />
      </div>
    </div>
  );
}
