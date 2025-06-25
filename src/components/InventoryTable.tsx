'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaEdit, FaExchangeAlt, FaSearch, FaTrash } from 'react-icons/fa';

interface InventoryItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  min_quantity: number;
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
  created_at: string;
  updated_at: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface InventoryTableProps {
  inventory: InventoryItem[];
  warehouses: Warehouse[];
  currentPage: number;
  totalPages: number;
  currentSearch: string;
  currentWarehouseId: string;
  total: number;
}

export default function InventoryTable({
  inventory,
  warehouses,
  currentPage,
  totalPages,
  currentSearch,
  currentWarehouseId,
  total
}: InventoryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedWarehouse, setSelectedWarehouse] = useState(currentWarehouseId);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const updateURL = (newSearch?: string, newWarehouse?: string, newPage?: number) => {
    const params = new URLSearchParams(searchParams);
    
    if (newSearch !== undefined) {
      if (newSearch) {
        params.set('search', newSearch);
      } else {
        params.delete('search');
      }
    }
    
    if (newWarehouse !== undefined) {
      if (newWarehouse) {
        params.set('warehouseId', newWarehouse);
      } else {
        params.delete('warehouseId');
      }
    }
    
    if (newPage !== undefined) {
      if (newPage > 1) {
        params.set('page', newPage.toString());
      } else {
        params.delete('page');
      }
    }

    router.push(`/dashboard/inventory?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL(searchTerm, selectedWarehouse, 1);
  };

  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
    updateURL(searchTerm, warehouseId, 1);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
        setDeleteConfirm(null);
      } else {
        console.error('Failed to delete inventory item');
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
    }
  };

  const getStatusBadge = (quantity: number, minQuantity: number) => {
    if (quantity === 0) {
      return (
        <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
          Out of Stock
        </span>
      );
    } else if (quantity <= minQuantity) {
      return (
        <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
          In Stock
        </span>
      );
    }
  };

  const startIndex = (currentPage - 1) * 50 + 1;
  const endIndex = Math.min(currentPage * 50, total);

  return (
    <div>
      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="sm:w-64">
          <select
            value={selectedWarehouse}
            onChange={(e) => handleWarehouseChange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
        
        <form onSubmit={handleSearch} className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search by product name or SKU"
          />
        </form>
        
        <div>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled
          >
            <FaExchangeAlt className="mr-2 h-4 w-4" />
            Transfer Stock
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      SKU
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Warehouse
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Quantity
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Min. Quantity
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {item.product_id ? (
                            <Link
                              href={`/dashboard/products/${item.product_id}`}
                              className="text-green-600 hover:text-green-900 hover:underline"
                            >
                              {item.product_name || 'Unknown Product'}
                            </Link>
                          ) : (
                            <span className="text-gray-500">
                              {item.product_name || 'Unknown Product'}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.product_sku || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.warehouse_name || 'Unknown Warehouse'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.min_quantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getStatusBadge(item.quantity, item.min_quantity)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/dashboard/inventory/${item.id}/edit`}
                              className="text-green-600 hover:text-green-900"
                            >
                              <FaEdit className="h-4 w-4" />
                            </Link>
                            {deleteConfirm === item.id ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-900 text-xs"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="text-gray-600 hover:text-gray-900 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            {currentPage > 1 && (
              <button
                onClick={() => updateURL(undefined, undefined, currentPage - 1)}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            {currentPage < totalPages && (
              <button
                onClick={() => updateURL(undefined, undefined, currentPage + 1)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            )}
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex}</span> to{' '}
                <span className="font-medium">{endIndex}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {currentPage > 1 && (
                  <button
                    onClick={() => updateURL(undefined, undefined, currentPage - 1)}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => updateURL(undefined, undefined, pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {currentPage < totalPages && (
                  <button
                    onClick={() => updateURL(undefined, undefined, currentPage + 1)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
