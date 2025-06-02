import React from 'react';
import Link from 'next/link';
import { requireAuth, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WarehouseModel } from '@/lib/models';
import WarehouseTable from '@/components/WarehouseTable';
import { FaPlus } from 'react-icons/fa';

export default async function WarehousesPage() {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  let warehouses = [];
  let error = null;

  try {
    warehouses = await WarehouseModel.getAll();
  } catch (err) {
    console.error('Error loading warehouses:', err);
    error = 'Failed to load warehouses';
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Warehouse Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your warehouse locations and facilities.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/warehouses/add"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-8">
        <WarehouseTable warehouses={warehouses} />
      </div>
    </div>
  );
}
