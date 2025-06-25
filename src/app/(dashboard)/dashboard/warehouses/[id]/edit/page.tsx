import React from 'react';
import {requireAuth, isAdmin} from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { WarehouseModel } from '@/lib/models';
import WarehouseForm from '@/components/WarehouseForm';

interface EditWarehousePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWarehousePage({ params }: EditWarehousePageProps) {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;

  let warehouse = null;
  let error = '';

  try {
    warehouse = await WarehouseModel.getById(id);
    if (!warehouse) {
      notFound();
    }
  } catch (err) {
    console.error('Error loading warehouse:', err);
    error = 'Failed to load warehouse';
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Warehouse</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Warehouse</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update warehouse information for {warehouse?.name}.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <WarehouseForm
          warehouseId={id}
          initialData={{
            name: warehouse!.name,
            address: warehouse!.address || '',
            city: warehouse!.city || '',
            state: warehouse!.state || '',
            zip: warehouse!.zip || ''
          }}
        />
      </div>
    </div>
  );
}
