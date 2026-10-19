'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {ProductWithFirstImage, ProductCategory} from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';
import ProductSearch from '@/components/products/ProductSearch';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import type { CatalogResult, CatalogFilters } from '@/lib/catalog';

interface ProductsResponse {
  products: ProductWithFirstImage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductCatalogProps {
  initialCatalog: CatalogResult;
  categories: ProductCategory[];
  filters: Required<CatalogFilters>;
  category?: ProductCategory;
}

export default function ProductCatalog({ initialCatalog, categories, filters, category }: ProductCatalogProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { applyAffiliateCode, state } = useCart();
  const [products, setProducts] = useState<ProductWithFirstImage[]>(initialCatalog.products);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [selectedCategory, setSelectedCategory] = useState(filters.category);
  const [sortBy, setSortBy] = useState(filters.sort);
  const [currentPage, setCurrentPage] = useState(filters.page);
  const [pagination, setPagination] = useState(initialCatalog.pagination);
  const initialRequest = useRef(true);

  const fetchProducts = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      const _response = await fetch(`/api/public/products?${params}`, { signal });
      if (!_response.ok) throw new Error(`Product request failed (${_response.status})`);
      const _data: ProductsResponse = await _response.json();
      if (signal.aborted) return;
      setProducts(_data.products);
      setPagination(_data.pagination);
    } catch (_error) {
      if (signal.aborted) return;
      console.error('Error fetching products:', _error);
      setError('Unable to load products. Please try again.');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [currentPage, searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    if (initialRequest.current) {
      initialRequest.current = false;
      return;
    }
    const controller = new AbortController();
    void fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  // Check for affiliate code in URL
  useEffect(() => {
    const handleAffiliateCode = async (code: string) => {
      try {
        const response = await fetch(`/api/public/affiliate-codes/${encodeURIComponent(code)}`);
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
    const affiliateCode = searchParams.get('ref');
    if (affiliateCode && !state.affiliateCode) {
      handleAffiliateCode(affiliateCode);
    }
  }, [searchParams, state.affiliateCode, applyAffiliateCode]);

  const handleSearchChange = useCallback((_query: string) => {
    setSearchQuery(_query);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleCategoryChange = useCallback((_categoryId: string) => {
    if (category) {
      const next = categories.find(item => item.id === _categoryId);
      router.push(next?.slug ? `/products/category/${next.slug}` : '/products');
      return;
    }
    setSelectedCategory(_categoryId);
    setCurrentPage(1); // Reset to first page when filtering
  }, [category, categories, router]);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  const handleClearFilters = useCallback(() => {
    if (category) {
      router.push('/products');
      return;
    }
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('');
    setCurrentPage(1);
  }, [category, router]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageHref = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
    if (selectedCategory && !category) params.set('category', selectedCategory);
    else params.delete('category');
    if (sortBy) params.set('sort', sortBy);
    else params.delete('sort');
    return `${category ? `/products/category/${category.slug}` : '/products'}?${params}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={category ? [{ label: 'Products', href: '/products' }, { label: category.name }] : [{ label: 'Products' }]}
          className="mb-6"
        />

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{category?.name || 'Our Products'}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {category?.description || 'Discover our comprehensive range of solar products designed to help you harness clean, renewable energy for your home or business.'}
          </p>
        </div>

        {/* Search and Filters */}
        <ProductSearch
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          sortBy={sortBy}
          categories={categories}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
        />

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Products Grid */}
        {error && <p role="alert" className="my-6 text-red-700">{error}</p>}
        {!loading && !error && (
          <>
            {products.length > 0 ? (
              <>
                {/* Results Summary */}
                <div className="mb-6">
                  <p className="text-gray-600">
                    Showing {products.length} of {pagination.total} products
                    {searchQuery && ` for "${searchQuery}"`}
                    {selectedCategory && ` in ${categories.find(c => c.id === selectedCategory)?.name || 'selected category'}`}
                  </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={pageHref(page)}
                        onClick={(event) => {
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                          event.preventDefault();
                          handlePageChange(page);
                        }}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === currentPage
                            ? 'bg-green-500 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </Link>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* No Results */
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedCategory
                    ? 'Try adjusting your search criteria or clearing filters.'
                    : 'No products are currently available.' }
                </p>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={handleClearFilters}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
