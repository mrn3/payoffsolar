import React from 'react';
import {requireAuth, isAdmin} from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { InventoryModel } from '@/lib/models';
import InventoryForm from '@/components/InventoryForm';

interface EditInventoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInventoryPage({ params }: EditInventoryPageProps) {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;

  let inventory = null;
  let error = '';

  try {
    inventory = await InventoryModel.getById(id);
    if (!inventory) {
      notFound();
    }
  } catch (err) {
    console.error('Error loading inventory:', err);
    error = 'Failed to load inventory item';
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Inventory Item</h1>
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
        <h1 className="text-2xl font-semibold text-gray-900">Edit Inventory Item</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update inventory quantities for {inventory?.product_name} at {inventory?.warehouse_name}.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <InventoryForm
          inventoryId={id}
          initialData={{
            product_id: inventory!.product_id,
            warehouse_id: inventory!.warehouse_id,
            quantity: inventory!.quantity,
            min_quantity: inventory!.min_quantity
          }}
        />
      </div>
    </div>
  );
}
