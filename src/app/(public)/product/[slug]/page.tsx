'use client';

import React, { useState, useEffect } from 'react';
import {useParams, useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {Product, ProductImage} from '@/lib/models';
import ImageCarousel from '@/components/ui/ImageCarousel';
import Breadcrumb from '@/components/ui/Breadcrumb';
import RelatedProducts from '@/components/products/RelatedProducts';
import { useCart } from '@/contexts/CartContext';
import { trackViewItem, formatGAItem } from '@/components/GoogleAnalytics';
import {FaArrowLeft, FaImage, FaMinus, FaPlus, FaShoppingCart, FaSpinner, FaFilePdf, FaDownload, FaTag} from 'react-icons/fa';
import toast from 'react-hot-toast';



interface ProductWithDetails extends Product {
  category_name?: string;
  images?: ProductImage[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { addItem, applyAffiliateCode, getDiscountedPrice, state } = useCart();

  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string);
    }
  }, [params.slug]);

  // Check for affiliate code in URL
  useEffect(() => {
    const affiliateCode = searchParams.get('ref');
    if (affiliateCode && !state.affiliateCode) {
      handleAffiliateCode(affiliateCode);
    }
  }, [searchParams, state.affiliateCode]);

  const handleAffiliateCode = async (code: string) => {
    try {
      const response = await fetch(`/api/public/affiliate-codes/${code}`);
      if (response.ok) {
        const data = await response.json();
        applyAffiliateCode(data.affiliateCode);
        toast.success(`Discount code "${code}" applied!`);
      } else {
        console.warn('Invalid affiliate code:', code);
      }
    } catch (error) {
      console.error('Error applying affiliate code:', error);
    }
  };

  const fetchProduct = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch product by slug
      const productResponse = await fetch(`/api/public/products/slug/${slug}`);
      if (!productResponse.ok) {
        if (productResponse.status === 404) {
          setError('Product not found');
          return;
        }
        throw new Error('Failed to fetch product');
      }

      const productData = await productResponse.json();
      setProduct(productData.product);

      // Track view item event
      try {
        const gaItem = formatGAItem({
          id: productData.product.id,
          sku: productData.product.sku,
          name: productData.product.name,
          price: productData.product.price,
          category_name: productData.product.category_name || 'Product'
        }, 1);

        trackViewItem('USD', productData.product.price, [gaItem]);
      } catch (error) {
        console.error('Error tracking view item:', error);
      }
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
        product_tax_percentage: product.tax_percentage || 0,
      }, quantity);
      toast.success(`Added ${quantity} ${product.name} to cart`);
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            href="/products"
            className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
          >
            <FaArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
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

              {/* Price */}
              <div className="mb-6">
                {state.affiliateCode ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(product.price)}
                      </span>
                      <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded flex items-center gap-1">
                        <FaTag className="h-3 w-3" />
                        {state.affiliateCode.code}
                      </span>
                    </div>
                    <span className="text-3xl font-bold text-green-600">
                      {formatPrice(getDiscountedPrice(product.price))}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <div 
                    className="text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}

              {/* Data Sheet */}
              {product.data_sheet_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
                  <a
                    href={product.data_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
                  >
                    <FaFilePdf className="h-4 w-4 mr-2" />
                    View Data Sheet
                    <FaDownload className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-4 mb-4">
                  <label className="text-sm font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center border rounded-md">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="p-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <FaMinus className="h-3 w-3" />
                    </button>
                    <span className="px-4 py-2 border-x">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-2 hover:bg-gray-100 transition-colors"
                    >
                      <FaPlus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <FaShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {product.category_id && (
          <div className="mt-12">
            <RelatedProducts 
              categoryId={product.category_id} 
              currentProductId={product.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
