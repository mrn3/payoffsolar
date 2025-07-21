import React, { useState, useEffect } from 'react';
import { ProductWithFirstImage } from '@/lib/types';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

interface RelatedProductsProps {
  currentProductId: string;
  categoryId?: string;
}

export default function RelatedProducts({ currentProductId, categoryId }: RelatedProductsProps) {
  const [products, setProducts] = useState<ProductWithFirstImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentProductId, categoryId]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: '4', // Show 4 related products
      });

      // If we have a category, filter by it, otherwise get random products
      if (categoryId) {
        params.append('categoryId', categoryId);
      }

      const _response = await fetch(`/api/public/products?${params}`);
      if (_response.ok) {
        const data = await _response.json();
        // Filter out the current product
        const filteredProducts = data.products.filter(
          (product: ProductWithFirstImage) => product.id !== currentProductId
        );
        setProducts(filteredProducts.slice(0, 4)); // Ensure we only show 4
      }
    } catch (_error) {
      console.error('Error fetching related products:', _error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Don&apos;t show the section if no related products
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {categoryId ? 'Related Products' : 'Other Products'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
