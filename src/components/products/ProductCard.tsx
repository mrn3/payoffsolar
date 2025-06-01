import React from 'react';
import Link from 'next/link';
import { ProductWithFirstImage } from '@/lib/models';
import { FaImage } from 'react-icons/fa';

interface ProductCardProps {
  product: ProductWithFirstImage;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/products/${product.id}`} className="block">
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {product.first_image_url ? (
            <img
              src={product.first_image_url}
              alt={product.name}
              className="w-full h-48 object-cover hover:opacity-90 transition-opacity duration-200"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
              <FaImage className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        {product.category_name && (
          <p className="text-sm text-green-600 mb-2">
            {product.category_name}
          </p>
        )}
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-gray-500">
            SKU: {product.sku}
          </span>
        </div>
        <Link
          href={`/products/${product.id}`}
          className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-center block font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
