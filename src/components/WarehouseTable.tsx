'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {FaEdit, FaMapMarkerAlt, FaTrash} from 'react-icons/fa';

interface Warehouse {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  created_at: string;
  updated_at: string;
}

interface WarehouseTableProps {
  warehouses: Warehouse[];
}

export default function WarehouseTable({ warehouses }: WarehouseTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (_id: string) => {
    try {
      const _response = await fetch(`/api/warehouses/${_id}`, {
        method: 'DELETE',
      });

      if (_response.ok) {
        router.refresh();
        setDeleteConfirm(null);
      } else {
        console.error('Failed to delete warehouse');
      }
    } catch (_error) {
      console.error('Error deleting warehouse: ', _error);
    }
  };

  const formatAddress = (warehouse: Warehouse) => {
    const parts = [warehouse.address, warehouse.city, warehouse.state, warehouse.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Address
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Created
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No warehouses found.
                    </td>
                  </tr>
                ) : (
                  warehouses.map((warehouse) => (
                    <tr key={warehouse.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="mr-2 h-4 w-4 text-gray-400" />
                          {warehouse.name}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {formatAddress(warehouse)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(warehouse.created_at).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/warehouses/${warehouse.id}/edit`}
                            className="text-green-600 hover:text-green-900"
                          >
                            <FaEdit className="h-4 w-4" />
                          </Link>
                          {deleteConfirm === warehouse.id ? (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleDelete(warehouse.id)}
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
                              onClick={() => setDeleteConfirm(warehouse.id)}
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
  );
}
