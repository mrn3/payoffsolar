// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { InventoryModel, WarehouseModel } from '@/lib/models';
import type { Inventory } from '@/lib/types';
import { GET } from './route';

vi.mock('@/lib/auth', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/models', () => ({
  InventoryModel: { getByProductId: vi.fn() },
  WarehouseModel: { getById: vi.fn() },
}));

const inventory = (warehouseId: string, quantity: number): Inventory => ({
  id: `inventory-${warehouseId}`,
  product_id: 'panel-550',
  warehouse_id: warehouseId,
  quantity,
  min_quantity: 0,
  created_at: '',
  updated_at: '',
});

const request = new NextRequest('http://localhost/api/products/panel-550/warehouses');
const context = () => ({ params: Promise.resolve({ id: 'panel-550' }) });

describe('product warehouse options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(InventoryModel.getByProductId).mockResolvedValue([]);
    vi.mocked(WarehouseModel.getById).mockResolvedValue({
      id: 'warehouse-1',
      name: 'Main warehouse',
      created_at: '',
      updated_at: '',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('awaits route params and returns warehouses with positive inventory', async () => {
    vi.mocked(InventoryModel.getByProductId).mockResolvedValue([
      inventory('warehouse-1', 11),
      inventory('warehouse-empty', 0),
      inventory('warehouse-negative', -2),
    ]);

    const response = await GET(request, context());

    expect(response.status).toBe(200);
    expect(InventoryModel.getByProductId).toHaveBeenCalledWith('panel-550');
    expect(await response.json()).toEqual({
      warehouses: [{ id: 'warehouse-1', name: 'Main warehouse', available_quantity: 11 }],
    });
    expect(WarehouseModel.getById).toHaveBeenCalledTimes(1);
  });

  it('returns an empty list when the product has no inventory', async () => {
    const response = await GET(request, context());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ warehouses: [] });
  });

  it('combines duplicate warehouse entries', async () => {
    vi.mocked(InventoryModel.getByProductId).mockResolvedValue([
      inventory('warehouse-1', 11),
      inventory('warehouse-1', 4),
    ]);

    const response = await GET(request, context());

    expect(await response.json()).toEqual({
      warehouses: [{ id: 'warehouse-1', name: 'Main warehouse', available_quantity: 15 }],
    });
  });

  it('uses the warehouse ID when its name cannot be found', async () => {
    vi.mocked(InventoryModel.getByProductId).mockResolvedValue([inventory('warehouse-1', 11)]);
    vi.mocked(WarehouseModel.getById).mockResolvedValue(null);

    const response = await GET(request, context());

    expect(await response.json()).toEqual({
      warehouses: [{ id: 'warehouse-1', name: 'warehouse-1', available_quantity: 11 }],
    });
  });

  it('rejects an empty product ID before querying inventory', async () => {
    const response = await GET(request, { params: Promise.resolve({ id: '' }) });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Product ID is required' });
    expect(InventoryModel.getByProductId).not.toHaveBeenCalled();
  });

  it('reports inventory lookup errors instead of returning an empty list', async () => {
    const error = new Error('Database unavailable');
    vi.mocked(InventoryModel.getByProductId).mockRejectedValue(error);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(request, context());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
    expect(log).toHaveBeenCalledWith('Error fetching product warehouses:', error);
  });
});
