import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { ProductCategory } from '@/lib/models';

interface ProductSearchProps {
  searchQuery: string;
  selectedCategory: string;
  sortBy: string;
  categories: ProductCategory[];
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onSortChange: (sortBy: string) => void;
  onClearFilters: () => void;
}

export default function ProductSearch({
  searchQuery,
  selectedCategory,
  sortBy,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onClearFilters,
}: ProductSearchProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearchChange]);

  const hasActiveFilters = searchQuery || selectedCategory || sortBy;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="lg:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Filter */}
        <div className="lg:w-64">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Sort by</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FaTimes className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              Search: "{searchQuery}"
              <button
                onClick={() => {
                  setLocalSearchQuery('');
                  onSearchChange('');
                }}
                className="ml-1 hover:text-green-600"
              >
                <FaTimes className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Category: {categories.find(c => c.id === selectedCategory)?.name}
              <button
                onClick={() => onCategoryChange('')}
                className="ml-1 hover:text-blue-600"
              >
                <FaTimes className="h-3 w-3" />
              </button>
            </span>
          )}
          {sortBy && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
              Sort: {sortBy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <button
                onClick={() => onSortChange('')}
                className="ml-1 hover:text-purple-600"
              >
                <FaTimes className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
