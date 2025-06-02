import React from 'react';
import { requireAuth, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import WarehouseForm from '@/components/WarehouseForm';

export default async function AddWarehousePage() {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add Warehouse</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create a new warehouse location for inventory management.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <WarehouseForm />
      </div>
    </div>
  );
}
