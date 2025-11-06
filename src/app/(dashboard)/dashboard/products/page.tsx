'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithFirstImage } from '@/lib/types';
import DeleteProductModal from '@/components/products/DeleteProductModal';
import DeleteAllProductsModal from '@/components/products/DeleteAllProductsModal';
import ImportProductsModal from '@/components/products/ImportProductsModal';
import BulkMergeProductsModal from '@/components/products/BulkMergeProductsModal';
import DuplicateProductsModal from '@/components/products/DuplicateProductsModal';
import BulkListingModal from '@/components/listings/BulkListingModal';
import {FaEdit, FaEye, FaImage, FaPlus, FaSearch, FaTrash, FaTrashAlt, FaUpload, FaCopy, FaTimes, FaGlobe, FaBox} from 'react-icons/fa';
import { createTextPreview } from '@/lib/utils/text';
import toast from 'react-hot-toast';

import Pagination from '@/components/ui/Pagination';


interface ProductsResponse {
  products: ProductWithFirstImage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithFirstImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithFirstImage | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [showBulkMergeModal, setShowBulkMergeModal] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showBulkListingModal, setShowBulkListingModal] = useState(false);

  const fetchProducts = async (page: number, search: string = '', includeInactiveProducts: boolean = false, categoryId: string = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (search) {
        params.append('search', search);
      }

      if (categoryId) {
        params.append('category', categoryId);
      }

      if (includeInactiveProducts) {
        params.append('includeInactive', 'true');
      }

      const _response = await fetch(`/api/products?${params}`, {
        credentials: 'include'
      });
      if (!_response.ok) {
        throw new Error('Failed to fetch products');
      }

      const _data: ProductsResponse = await _response.json();
      setProducts(_data.products);
      setCurrentPage(_data.pagination.page);
      setTotalPages(_data.pagination.totalPages);
      setTotal(_data.pagination.total);
    } catch (_error) {
      console.error('Error fetching products:', _error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

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

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(1, searchQuery, includeInactive, selectedCategory);
  }, [searchQuery, includeInactive, selectedCategory]);

  const handleSearch = (_e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(_e.target.value);
    setCurrentPage(1);
  };

  const handleIncludeInactiveChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeInactive(_e.target.checked);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const navigateToAdd = () => {
    router.push('/dashboard/products/new');
  };

  const handleImportComplete = () => {
    fetchProducts(currentPage, searchQuery, includeInactive, selectedCategory);
  };

  // Bulk selection functions
  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProductIds);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProductIds(newSelected);

    // Update select all checkbox state
    setIsSelectAllChecked(newSelected.size === products.length && products.length > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(products.map(product => product.id));
      setSelectedProductIds(allIds);
    } else {
      setSelectedProductIds(new Set());
    }
    setIsSelectAllChecked(checked);
  };

  const clearSelection = () => {
    setSelectedProductIds(new Set());
    setIsSelectAllChecked(false);
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      const _response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'DELETE'
      });

      if (!_response.ok) {
        const errorData = await _response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      await fetchProducts(currentPage, searchQuery, includeInactive);
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  const handleDeleteAllProducts = async () => {
    try {
      const _response = await fetch('/api/products/bulk-delete', {
        method: 'DELETE'
      });

      if (!_response.ok) {
        const errorData = await _response.json();
        throw new Error(errorData.error || 'Failed to delete all products');
      }

      await fetchProducts(1, '', includeInactive, selectedCategory);
      setSearchQuery('');
      setLocalSearchQuery('');
      setCurrentPage(1);
      setIsDeleteAllModalOpen(false);
    } catch (err) {
      console.error('Error deleting all products:', err);
      throw err;
    }
  };

  const navigateToEdit = (product: ProductWithFirstImage) => {
    router.push(`/dashboard/products/${product.id}/edit`);
  };

  const openDeleteModal = (product: ProductWithFirstImage) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const duplicateProduct = async (product: ProductWithFirstImage) => {
    try {
      setDuplicatingId(product.id);
      const res = await fetch(`/api/products/${product.id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to duplicate product');
      }
      toast.success('Product duplicated');
      router.push(`/dashboard/products/${data.product.id}/edit`);
    } catch (err: any) {
      console.error('Duplicate product failed:', err);
      toast.error(err?.message || 'Failed to duplicate product');
    } finally {
      setDuplicatingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all products in your inventory including their name, price, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <FaUpload className="mr-2 h-4 w-4" />
              Import
            </button>
            {total > 0 && (
              <button
                type="button"
                onClick={() => setShowDuplicatesModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                <FaCopy className="mr-2 h-4 w-4" />
                Find Duplicates
              </button>
            )}
            {total > 0 && (
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
              >
                <FaTrashAlt className="mr-2 h-4 w-4" />
                Delete All
              </button>
            )}
            <button
              type="button"
              onClick={navigateToAdd}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add product
            </button>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={localSearchQuery}
            onChange={handleSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search products by name, description, or SKU"
          />
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={handleIncludeInactiveChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Include inactive products</span>
          </label>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedProductIds.size > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedProductIds.size} product{selectedProductIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBulkMergeModal(true)}
                  disabled={selectedProductIds.size < 2}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaCopy className="mr-1 h-3 w-3" />
                  Merge Duplicates
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkListingModal(true)}
                  disabled={selectedProductIds.size === 0}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaGlobe className="mr-1 h-3 w-3" />
                  Create Listings
                </button>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FaTimes className="h-4 w-4" />
              <span className="sr-only">Clear selection</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading products...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="mt-8 text-center">
          <FaImage className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating a new product.' }
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <button
                type="button"
                onClick={navigateToAdd}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Add product
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products grid */}
      {!loading && products.length > 0 && (
        <div className="mt-8">
          {/* Select All Checkbox */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isSelectAllChecked}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Select all products on this page
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className={`relative bg-white overflow-hidden shadow rounded-lg ${!product.is_active ? 'opacity-75' : ''} ${selectedProductIds.has(product.id) ? 'ring-2 ring-blue-500' : ''}`}>
                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.has(product.id)}
                    onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded bg-white"
                  />
                </div>
              <button
                onClick={() => router.push(`/dashboard/products/${product.id}`)}
                className="w-full h-48 bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
              >
                {(product.first_image_url || product.image_url) ? (
                  <img
                    src={product.first_image_url || product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover hover:opacity-90 transition-opacity duration-200"
                    onError={(_e) => {
                      _e.currentTarget.style.display = 'none';
                      _e.currentTarget.nextElementSibling!.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`flex items-center justify-center h-full w-full ${(product.first_image_url || product.image_url) ? 'hidden' : ''}`}>
                  <FaImage className="h-12 w-12 text-gray-400" />
                </div>
              </button>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 truncate" title={product.name}>
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2" title={createTextPreview(product.description || '', 200)}>
                  {createTextPreview(product.description || '', 100) || 'No description available'}
                </p>
                {product.category_name && (
                  <p className="mt-1 text-xs text-blue-600">
                    {product.category_name}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <div className="flex items-center space-x-2">
                    {product.is_bundle && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FaBox className="h-3 w-3 mr-1" />
                        Bundle
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive' }
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500 truncate" title={`SKU: ${product.sku}`}>
                    SKU: {product.sku}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/products/${product.id}`)}
                      className="text-green-600 hover:text-green-900"
                      title="View product"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToEdit(product)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit product"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateProduct(product)}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      title="Duplicate product"
                      disabled={duplicatingId === product.id}
                    >
                      <FaCopy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteModal(product)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete product"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && products.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={12}
          onPageChange={(p) => fetchProducts(p, searchQuery, includeInactive, selectedCategory)}
        />
      )}

      {/* Delete Modal */}
      <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        product={selectedProduct}
      />

      {/* Delete All Modal */}
      <DeleteAllProductsModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAllProducts}
        productCount={total}
      />

      {/* Import Modal */}
      <ImportProductsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Bulk Merge Modal */}
      <BulkMergeProductsModal
        isOpen={showBulkMergeModal}
        onClose={() => setShowBulkMergeModal(false)}
        selectedProductIds={Array.from(selectedProductIds)}
        onComplete={() => {
          clearSelection();
          fetchProducts(currentPage, searchQuery, includeInactive, selectedCategory);
        }}
      />

      {/* Duplicates Modal */}
      <DuplicateProductsModal
        isOpen={showDuplicatesModal}
        onClose={() => setShowDuplicatesModal(false)}
        onMergeComplete={() => {
          fetchProducts(currentPage, searchQuery, includeInactive, selectedCategory);
        }}
      />

      {/* Bulk Listing Modal */}
      <BulkListingModal
        isOpen={showBulkListingModal}
        onClose={() => setShowBulkListingModal(false)}
        selectedProducts={products.filter(p => selectedProductIds.has(p.id))}
        onComplete={() => {
          clearSelection();
          fetchProducts(currentPage, searchQuery, includeInactive, selectedCategory);
        }}
      />
    </div>
  );
}
