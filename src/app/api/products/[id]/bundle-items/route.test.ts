// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { requireAuth, isAdmin, type AuthSession } from '@/lib/auth';
import { ProductBundleItemModel, ProductModel } from '@/lib/models';
import type { Product, ProductBundleItemWithProduct } from '@/lib/types';
import { GET, POST, DELETE as deleteAll } from './route';
import { PUT, DELETE as deleteItem } from '../../bundle-items/[id]/route';

vi.mock('@/lib/auth', () => ({ requireAuth: vi.fn(), isAdmin: vi.fn() }));
vi.mock('@/lib/models', () => ({
  ProductModel: { getById: vi.fn() },
  ProductBundleItemModel: {
    getByBundleId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteByBundleId: vi.fn(),
  },
}));

const session: AuthSession = {
  user: { id: 'admin-1', email: 'admin@example.test', email_verified: true, created_at: '' },
  profile: {
    id: 'admin-1', email: 'admin@example.test', first_name: 'Admin', last_name: 'User',
    phone: null, avatar_url: null, role: 'admin',
  },
};
const bundle: Product = {
  id: 'bundle-1', name: 'Solar bundle', description: '', price: 400, sku: 'BUNDLE',
  tax_percentage: 0, is_bundle: true, bundle_pricing_type: 'fixed',
  bundle_discount_percentage: 0, is_active: true, created_at: '', updated_at: '',
};
const component: Product = { ...bundle, id: 'component-1', is_bundle: false };
const item: ProductBundleItemWithProduct = {
  id: 'item-1', bundle_product_id: bundle.id, component_product_id: component.id,
  quantity: 2, sort_order: 0, created_at: '', updated_at: '',
};
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (method: string, data?: object) => new NextRequest(
  'http://localhost/api/products/bundle-1/bundle-items',
  {
    method,
    ...(data ? {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    } : {}),
  }
);

describe('bundle component routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(session);
    vi.mocked(isAdmin).mockReturnValue(true);
    vi.mocked(ProductModel.getById).mockImplementation(async (id) => (
      id === bundle.id ? bundle : id === component.id ? component : null
    ));
    vi.mocked(ProductBundleItemModel.getByBundleId).mockResolvedValue([item]);
    vi.mocked(ProductBundleItemModel.create).mockResolvedValue(item.id);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the requested bundle using promised route params', async () => {
    const response = await GET(request('GET'), context(bundle.id));

    expect(response.status).toBe(200);
    expect(ProductBundleItemModel.getByBundleId).toHaveBeenCalledWith(bundle.id);
    expect(await response.json()).toEqual({ bundleItems: [item] });
  });

  it('adds a component to the requested bundle using promised route params', async () => {
    const response = await POST(request('POST', {
      component_product_id: component.id, quantity: 2,
    }), context(bundle.id));

    expect(response.status).toBe(201);
    expect(ProductModel.getById).toHaveBeenCalledWith(bundle.id);
    expect(ProductBundleItemModel.create).toHaveBeenCalledWith({
      bundle_product_id: bundle.id, component_product_id: component.id,
      quantity: 2, sort_order: 0,
    });
    expect(ProductBundleItemModel.getByBundleId).toHaveBeenCalledWith(bundle.id);
    expect(await response.json()).toEqual({ bundleItems: [item] });
  });

  it('updates the requested component quantity and sort order', async () => {
    const response = await PUT(
      request('PUT', { quantity: 4, sort_order: 3 }), context(item.id)
    );

    expect(response.status).toBe(200);
    expect(ProductBundleItemModel.update).toHaveBeenCalledWith(item.id, {
      quantity: 4, sort_order: 3,
    });
    expect(await response.json()).toEqual({ message: 'Bundle item updated successfully' });
  });

  it('removes only the requested component using promised route params', async () => {
    const response = await deleteItem(request('DELETE'), context(item.id));

    expect(response.status).toBe(200);
    expect(ProductBundleItemModel.delete).toHaveBeenCalledWith(item.id);
    expect(ProductBundleItemModel.deleteByBundleId).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ message: 'Bundle item deleted successfully' });
  });

  it('removes all components only from the requested bundle', async () => {
    const response = await deleteAll(request('DELETE'), context(bundle.id));

    expect(response.status).toBe(200);
    expect(ProductBundleItemModel.deleteByBundleId).toHaveBeenCalledWith(bundle.id);
    expect(ProductBundleItemModel.delete).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ message: 'All bundle items deleted successfully' });
  });

  it('continues to reject non-admin mutations without model calls', async () => {
    vi.mocked(isAdmin).mockReturnValue(false);
    const responses = await Promise.all([
      POST(request('POST', { component_product_id: component.id, quantity: 2 }), context(bundle.id)),
      PUT(request('PUT', { quantity: 4 }), context(item.id)),
      deleteItem(request('DELETE'), context(item.id)),
      deleteAll(request('DELETE'), context(bundle.id)),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    }
    for (const method of Object.values(ProductBundleItemModel)) {
      expect(method).not.toHaveBeenCalled();
    }
    expect(ProductModel.getById).not.toHaveBeenCalled();
  });

  it('continues to prevent adding a bundle to itself', async () => {
    const response = await POST(request('POST', {
      component_product_id: bundle.id, quantity: 1,
    }), context(bundle.id));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Cannot add a bundle as a component of itself' });
    expect(ProductBundleItemModel.create).not.toHaveBeenCalled();
  });

  it.each([POST, PUT])('continues to reject negative quantities', async (handler) => {
    const response = await handler(request('POST', {
      component_product_id: component.id, quantity: -1,
    }), context(bundle.id));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Quantity must be a positive number' });
    expect(ProductBundleItemModel.create).not.toHaveBeenCalled();
    expect(ProductBundleItemModel.update).not.toHaveBeenCalled();
  });

  it('reports model failures instead of claiming a component was removed', async () => {
    const error = new Error('Database unavailable');
    vi.mocked(ProductBundleItemModel.delete).mockRejectedValueOnce(error);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await deleteItem(request('DELETE'), context(item.id));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
    expect(log).toHaveBeenCalledWith('Error deleting bundle item:', error);
  });
});
