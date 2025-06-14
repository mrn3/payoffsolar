'use client';

import React, { useState, useEffect } from 'react';
import {ProductWithFirstImage, ProductCategory} from '@/lib/models';
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

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithFirstImage[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Fetch products when search/filter parameters change
  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, sortBy, currentPage]);

  const fetchCategories = async () => {
    try {
      const _response = await fetch('/api/public/product-categories');
      if (_response.ok) {
        const _data: CategoriesResponse = await _response.json();
        setCategories(_data.categories);
      }
    } catch (_error) {
      console.error('Error fetching categories:', _error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
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

      const _response = await fetch(`/api/public/products?${params}`);
      if (_response.ok) {
        const _data: ProductsResponse = await _response.json();
        setProducts(_data.products);
        setPagination(_data.pagination);
      }
    } catch (_error) {
      console.error('Error fetching products:', _error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (_query: string) => {
    setSearchQuery(_query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleCategoryChange = (_categoryId: string) => {
    setSelectedCategory(_categoryId);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ label: 'Products' }]}
          className="mb-6"
        />

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our comprehensive range of solar products designed to help you harness clean,
            renewable energy for your home or business.
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
        {!loading && (
          <>
            {products.length > 0 ? (
              <>
                {/* Results Summary */}
                <div className="mb-6">
                  <p className="text-gray-600">
                    Showing {products.length} of {pagination.total} products
                    {searchQuery && ` for "${searchQuery}"`}
                    {selectedCategory && ` in ${categories.find(c => c._id === selectedCategory)?.name}`}
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
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === currentPage
                            ? 'bg-green-500 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
