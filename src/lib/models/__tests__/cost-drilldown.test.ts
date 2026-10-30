import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../mysql/connection', () => ({
  executeQuery: vi.fn(),
  executeSingle: vi.fn(),
  getOne: vi.fn(),
}));

import { executeQuery } from '../../mysql/connection';
import { OrderModel } from '../index';

const query = vi.mocked(executeQuery);
const periods = [
  { cost: OrderModel.getOrdersByYearAndCostCategory, product: OrderModel.getOrdersByYearAndCategory, period: '2026', date: 'YEAR(o.order_date) = ?' },
  { cost: OrderModel.getOrdersByMonthAndCostCategory, product: OrderModel.getOrdersByMonthAndCategory, period: '2026-10', date: "DATE_FORMAT(o.order_date, '%Y-%m') = ?" },
  { cost: OrderModel.getOrdersByWeekAndCostCategory, product: OrderModel.getOrdersByWeekAndCategory, period: '2026-00', date: "DATE_FORMAT(o.order_date, '%Y-%u') = ?" },
  { cost: OrderModel.getOrdersByDayAndCostCategory, product: OrderModel.getOrdersByDayAndCategory, period: '2026-10-30', date: "DATE_FORMAT(o.order_date, '%Y-%m-%d') = ?" },
];

describe('cost chart order lookups', () => {
  beforeEach(() => {
    query.mockReset();
    query.mockResolvedValue([]);
  });

  it.each(periods)('matches cost items for $period without using product categories', async ({ cost, period, date }) => {
    const rows = [{ id: 'commission-order', contact_name: 'Customer' }];
    query.mockResolvedValueOnce(rows);

    expect(await cost(period, 'Kip Commission')).toEqual(rows);

    const [sql, params] = query.mock.calls[0];
    expect(params).toEqual([period, 'Kip Commission']);
    expect(sql).toContain(date);
    expect(sql).toContain("o.status = 'complete'");
    expect(sql).toContain('SELECT DISTINCT o.*');
    expect(sql).toContain('INNER JOIN cost_items ci ON o.id = ci.order_id');
    expect(sql).toContain('INNER JOIN cost_categories cc ON ci.category_id = cc.id');
    expect(sql).toContain('cc.name = ?');
    expect(sql).not.toContain('product_categories');
  });

  it.each(periods)('preserves product category lookups for $period', async ({ product, period }) => {
    await product(period, 'Panels');
    const [sql] = query.mock.calls[0];
    expect(sql).toContain('LEFT JOIN product_categories pc ON p.category_id = pc.id');
    expect(sql).toContain("COALESCE(pc.name, 'Uncategorized') = ?");
    expect(sql).not.toContain('cost_items');
  });
});
