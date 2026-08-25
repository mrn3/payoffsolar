import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../mysql/connection', () => ({
  executeQuery: vi.fn(),
  executeSingle: vi.fn(),
  getOne: vi.fn(),
}));

import { executeQuery } from '../../mysql/connection';
import { OrderModel, ProductModel } from '../index';

const mockExecuteQuery = vi.mocked(executeQuery);

describe('product units dashboard data', () => {
  beforeEach(() => {
    mockExecuteQuery.mockReset();
    mockExecuteQuery.mockResolvedValue([]);
  });

  it('loads both active and inactive products for the selector', async () => {
    await ProductModel.getDashboardOptionsIncludingInactive();

    const [sql, params] = mockExecuteQuery.mock.calls[0];
    expect(sql).toMatch(/SELECT id, name, sku, is_active/);
    expect(sql).not.toMatch(/WHERE is_active/);
    expect(sql).toMatch(/ORDER BY name ASC, sku ASC/);
    expect(params).toBeUndefined();
  });

  it('aggregates all product quantities by month and order status', async () => {
    await OrderModel.getProductUnitsByStatus('month', 12);

    const [sql, params] = mockExecuteQuery.mock.calls[0];
    expect(params).toEqual([12]);
    expect(sql).toMatch(/INNER JOIN order_items oi ON o\.id = oi\.order_id/);
    expect(sql).toMatch(/INNER JOIN products p ON oi\.product_id = p\.id/);
    expect(sql).toMatch(/SUM\(oi\.quantity\) as units/);
    expect(sql).toMatch(/GROUP BY DATE_FORMAT\(o\.order_date, '%Y-%m'\), o\.status/);
    expect(sql).not.toMatch(/p\.is_active/);
    expect(sql).not.toMatch(/oi\.product_id = \?/);
  });

  it('filters by a selected product using a query parameter', async () => {
    await OrderModel.getProductUnitsByStatus('week', 20, 'product-123');

    const [sql, params] = mockExecuteQuery.mock.calls[0];
    expect(params).toEqual([20, 'product-123']);
    expect(sql).toMatch(/AND oi\.product_id = \?/);
    expect(sql).toMatch(/GROUP BY YEAR\(o\.order_date\), WEEK\(o\.order_date, 1\), o\.status/);
  });

  it('groups YoY data by year, month, and status', async () => {
    await OrderModel.getProductUnitsByStatus('yoy', 3);

    const [sql, params] = mockExecuteQuery.mock.calls[0];
    expect(params).toEqual([3]);
    expect(sql).toMatch(/MAKEDATE\(YEAR\(CURDATE\(\)\) - \? \+ 1, 1\)/);
    expect(sql).toMatch(/GROUP BY YEAR\(o\.order_date\), MONTH\(o\.order_date\), o\.status/);
  });
});