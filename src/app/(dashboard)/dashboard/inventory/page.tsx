import React from 'react';
import Link from 'next/link';
import { requireAuth, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InventoryModel, WarehouseModel } from '@/lib/models';
import InventoryTable from '@/components/InventoryTable';
import { FaPlus, FaSearch, FaExchangeAlt, FaExclamationTriangle } from 'react-icons/fa';

interface InventoryPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    warehouseId?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const search = params.search || '';
  const warehouseId = params.warehouseId || '';
  const limit = 50;
  const offset = (page - 1) * limit;

  let inventory = [];
  let warehouses = [];
  let lowStockItems = [];
  let total = 0;
  let error = null;

  try {
    // Load inventory data
    inventory = await InventoryModel.getAll(
      limit,
      offset,
      warehouseId || undefined,
      search || undefined
    );
    total = await InventoryModel.getCount(
      warehouseId || undefined,
      search || undefined
    );

    // Load warehouses for filter dropdown
    warehouses = await WarehouseModel.getAll();

    // Load low stock items for alert
    lowStockItems = await InventoryModel.getLowStock(5);
  } catch (err) {
    console.error('Error loading inventory data:', err);
    error = 'Failed to load inventory data';
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and manage your inventory across multiple warehouses.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/inventory/add"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add inventory
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {lowStockItems.length} product{lowStockItems.length !== 1 ? 's are' : ' is'} below minimum stock level:
                </p>
                <ul className="mt-1 list-disc list-inside">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      {item.product_name} at {item.warehouse_name}: {item.quantity} (min: {item.min_quantity})
                    </li>
                  ))}
                  {lowStockItems.length > 3 && (
                    <li>...and {lowStockItems.length - 3} more</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="mt-8">
        <InventoryTable
          inventory={inventory}
          warehouses={warehouses}
          currentPage={page}
          totalPages={totalPages}
          currentSearch={search}
          currentWarehouseId={warehouseId}
          total={total}
        />
      </div>
    </div>
  );
}
