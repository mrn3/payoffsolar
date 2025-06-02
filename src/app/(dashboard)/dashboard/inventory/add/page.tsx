import React from 'react';
import { requireAuth, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import InventoryForm from '@/components/InventoryForm';

export default async function AddInventoryPage() {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add Inventory Item</h1>
        <p className="mt-2 text-sm text-gray-700">
          Add a new product to warehouse inventory.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <InventoryForm />
      </div>
    </div>
  );
}
