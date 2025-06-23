'use client';

import React from 'react';
import { requireAuth, isAdmin } from '@/lib/auth';
import ListingStatusDashboard from '@/components/listings/ListingStatusDashboard';

export default function ListingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Marketplace Listings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage and monitor your product listings across multiple platforms.
        </p>
      </div>

      <ListingStatusDashboard />
    </div>
  );
}
