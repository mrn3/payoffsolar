'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {ProductWithFirstImage, ProductCategory} from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';
import ProductSearch from '@/components/products/ProductSearch';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface ProductsResponse {
  products: ProductWithFirstImage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CategoriesResponse {
  categories: ProductCategory[];
}

export default function CategoryProductsPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.slug as string;
  
  const [products, setProducts] = useState<ProductWithFirstImage[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [currentCategory, setCurrentCategory] = useState<ProductCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Fetch categories and find current category
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const _response = await fetch('/api/public/product-categories');
        if (_response.ok) {
          const _data: CategoriesResponse = await _response.json();
          setCategories(_data.categories);
          
          // Find the category by slug
          const category = _data.categories.find(cat => cat.slug === categorySlug);
          if (category) {
            setCurrentCategory(category);
          } else {
            // Category not found, redirect to products page
            router.push('/products');
            return;
          }
        }
      } catch (_error) {
        console.error('Error fetching categories:', _error);
        router.push('/products');
      }
    };

    fetchCategories();
  }, [categorySlug, router]);

  const fetchProducts = useCallback(async () => {
    if (!currentCategory) return;
    
    console.log('fetchProducts called with currentPage:', currentPage);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        category: currentCategory.id
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      console.log('Fetching with URL:', `/api/public/products?${params}`);
      const _response = await fetch(`/api/public/products?${params}`);
      if (_response.ok) {
        const _data: ProductsResponse = await _response.json();
        console.log('Received data:', _data);
        setProducts(_data.products);
        setPagination(_data.pagination);
      }
    } catch (_error) {
      console.error('Error fetching products:', _error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, sortBy, currentCategory]);

  // Fetch products when search/filter parameters change
  useEffect(() => {
    if (currentCategory) {
      console.log('useEffect triggered, calling fetchProducts');
      fetchProducts();
    }
  }, [searchQuery, sortBy, currentCategory]);

  // Fetch products when page changes
  useEffect(() => {
    if (currentCategory) {
      console.log('currentPage changed to:', currentPage, 'calling fetchProducts');
      fetchProducts();
    }
  }, [currentPage, currentCategory]);

  const handleSearchChange = useCallback((_query: string) => {
    setSearchQuery(_query);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleCategoryChange = useCallback((_categoryId: string) => {
    if (!_categoryId) {
      // If no category selected, go to main products page
      router.push('/products');
    } else {
      // Find the category slug and navigate to its page
      const category = categories.find(cat => cat.id === _categoryId);
      if (category) {
        router.push(`/products/category/${category.slug}`);
      }
    }
  }, [categories, router]);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  const handleClearFilters = useCallback(() => {
    // On category page, clearing filters should go back to main products page
    router.push('/products');
  }, [router]);

  const handlePageChange = (page: number) => {
    console.log('handlePageChange called with page:', page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show loading while we determine the category
  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: currentCategory.name, href: `/products/category/${categorySlug}` }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentCategory.name}</h1>
          {currentCategory.description && (
            <p className="text-gray-600 text-lg">{currentCategory.description}</p>
          )}
        </div>

      <ProductSearch
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedCategory={currentCategory.id}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        showCategoryFilter={true}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchQuery 
              ? `No products found matching "${searchQuery}" in ${currentCategory.name}.`
              : `No products found in ${currentCategory.name}.`
            }
          </p>
          {searchQuery && (
            <button
              onClick={handleClearFilters}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'text-white bg-green-600 border border-green-600'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
