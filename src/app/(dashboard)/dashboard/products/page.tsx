'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaImage, FaEye } from 'react-icons/fa';
import { ProductWithFirstImage } from '@/lib/models';
import DeleteProductModal from '@/components/products/DeleteProductModal';
import { format } from 'date-fns';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithFirstImage | null>(null);

  const fetchProducts = async (page: number, search: string = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: ProductsResponse = await response.json();
      setProducts(data.products);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const navigateToAdd = () => {
    router.push('/dashboard/products/new');
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      await fetchProducts(currentPage, searchQuery);
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error deleting product:', err);
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

      {/* Search and filters */}
      <div className="mt-6 flex flex-col sm:flex-row">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search products by name, description, or SKU"
          />
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
          >
            <option>All Categories</option>
            <option>Solar Panels</option>
            <option>Batteries</option>
            <option>Inverters</option>
            <option>Accessories</option>
          </select>
        </div>
      </div>

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
            {searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating a new product.'}
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
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="bg-white overflow-hidden shadow rounded-lg">
              <button
                onClick={() => router.push(`/dashboard/products/${product.id}`)}
                className="w-full h-48 bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
              >
                {(product.first_image_url || product.image_url) ? (
                  <img
                    src={product.first_image_url || product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover hover:opacity-90 transition-opacity duration-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling!.style.display = 'flex';
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
                <p className="mt-1 text-sm text-gray-500 line-clamp-2" title={product.description}>
                  {product.description || 'No description available'}
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
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
      )}

      {/* Pagination */}
      {!loading && products.length > 0 && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => currentPage > 1 && fetchProducts(currentPage - 1, searchQuery)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => currentPage < totalPages && fetchProducts(currentPage + 1, searchQuery)}
              disabled={currentPage >= totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * 12) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 12, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => currentPage > 1 && fetchProducts(currentPage - 1, searchQuery)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => fetchProducts(page, searchQuery)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => currentPage < totalPages && fetchProducts(currentPage + 1, searchQuery)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        product={selectedProduct}
      />
    </div>
  );
}
