import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../mysql/connection', () => ({
  executeQuery: vi.fn(),
  executeSingle: vi.fn(),
  getOne: vi.fn(),
}));

import { executeQuery } from '../../mysql/connection';
import { OrderModel } from '../index';

const mockExecuteQuery = vi.mocked(executeQuery);

describe('OrderModel year-over-year methods', () => {
  beforeEach(() => {
    mockExecuteQuery.mockReset();
    mockExecuteQuery.mockResolvedValue([]);
  });

  describe('getRevenueByMonthYoY', () => {
    it('queries with default years=3 and groups by YEAR/MONTH', async () => {
      await OrderModel.getRevenueByMonthYoY();

      expect(mockExecuteQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockExecuteQuery.mock.calls[0];
      expect(params).toEqual([3]);
      expect(sql).toMatch(/YEAR\(order_date\) as year/);
      expect(sql).toMatch(/MONTH\(order_date\) as month_num/);
      expect(sql).toMatch(/MAKEDATE\(YEAR\(CURDATE\(\)\) - \? \+ 1, 1\)/);
      expect(sql).toMatch(/GROUP BY YEAR\(order_date\), MONTH\(order_date\)/);
      expect(sql).toMatch(/ORDER BY year ASC, month_num ASC/);
    });

    it('passes a custom number of years through to the query', async () => {
      await OrderModel.getRevenueByMonthYoY(5);
      expect(mockExecuteQuery.mock.calls[0][1]).toEqual([5]);
    });

    it('returns rows from executeQuery unchanged', async () => {
      const rows = [
        { year: '2023', month_num: 1, revenue: 100, count: 2 },
        { year: '2024', month_num: 1, revenue: 250, count: 5 },
      ];
      mockExecuteQuery.mockResolvedValueOnce(rows);
      const result = await OrderModel.getRevenueByMonthYoY();
      expect(result).toEqual(rows);
    });
  });

  describe('getRevenueByMonthAndStateYoY', () => {
    it('groups by year, month and state and uses MAKEDATE window', async () => {
      await OrderModel.getRevenueByMonthAndStateYoY(3);
      const [sql, params] = mockExecuteQuery.mock.calls[0];
      expect(params).toEqual([3]);
      expect(sql).toMatch(/COALESCE\(c\.state, 'Unknown'\) as state/);
      expect(sql).toMatch(/GROUP BY YEAR\(o\.order_date\), MONTH\(o\.order_date\), COALESCE\(c\.state, 'Unknown'\)/);
      expect(sql).toMatch(/ORDER BY year ASC, month_num ASC, state ASC/);
    });
  });

  describe('getOrderCountsByStatusAndMonthYoY', () => {
    it('groups by year, month and status', async () => {
      await OrderModel.getOrderCountsByStatusAndMonthYoY(3);
      const [sql, params] = mockExecuteQuery.mock.calls[0];
      expect(params).toEqual([3]);
      expect(sql).toMatch(/GROUP BY YEAR\(order_date\), MONTH\(order_date\), status/);
      expect(sql).toMatch(/ORDER BY year ASC, month_num ASC, status ASC/);
    });
  });

  describe('getCostBreakdownByMonthYoY', () => {
    it('does not include category filter when categoryId is omitted', async () => {
      await OrderModel.getCostBreakdownByMonthYoY(3);
      const [sql, params] = mockExecuteQuery.mock.calls[0];
      expect(params).toEqual([3]);
      expect(sql).not.toMatch(/cc\.id = \?/);
      expect(sql).toMatch(/INNER JOIN cost_items ci ON o\.id = ci\.order_id/);
      expect(sql).toMatch(/INNER JOIN cost_categories cc ON ci\.category_id = cc\.id/);
      expect(sql).toMatch(/o\.status = 'complete'/);
    });

    it('appends category filter and parameter when categoryId is provided', async () => {
      await OrderModel.getCostBreakdownByMonthYoY(3, 'cat-123');
      const [sql, params] = mockExecuteQuery.mock.calls[0];
      expect(params).toEqual([3, 'cat-123']);
      expect(sql).toMatch(/AND cc\.id = \?/);
    });

    it('treats null categoryId the same as omitted', async () => {
      await OrderModel.getCostBreakdownByMonthYoY(3, null);
      expect(mockExecuteQuery.mock.calls[0][1]).toEqual([3]);
    });
  });

  describe('getUnitsSoldByMonthAndCategoryYoY', () => {
    it('joins through order_items, products and product_categories', async () => {
      await OrderModel.getUnitsSoldByMonthAndCategoryYoY(3);
      const [sql, params] = mockExecuteQuery.mock.calls[0];
      expect(params).toEqual([3]);
      expect(sql).toMatch(/LEFT JOIN order_items oi ON o\.id = oi\.order_id/);
      expect(sql).toMatch(/LEFT JOIN products p ON oi\.product_id = p\.id/);
      expect(sql).toMatch(/LEFT JOIN product_categories pc ON p\.category_id = pc\.id/);
      expect(sql).toMatch(/SUM\(oi\.quantity\) as units_sold/);
      expect(sql).toMatch(/COUNT\(DISTINCT o\.id\) as order_count/);
    });
  });
});
