// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  admin: vi.fn(),
  year: vi.fn(),
  month: vi.fn(),
  week: vi.fn(),
  day: vi.fn(),
  costItems: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ getSession: mocks.session, isAdmin: mocks.admin }));
vi.mock('@/lib/models', () => ({
  OrderModel: {
    getOrdersByYearAndCostCategory: mocks.year,
    getOrdersByMonthAndCostCategory: mocks.month,
    getOrdersByWeekAndCostCategory: mocks.week,
    getOrdersByDayAndCostCategory: mocks.day,
  },
  CostItemModel: { getByOrderId: mocks.costItems },
}));

import { GET as year } from '../by-year-category/route';
import { GET as month } from '../by-month-category/route';
import { GET as week } from '../by-week-category/route';
import { GET as day } from '../by-day-category/route';

const routes = [
  { get: year, type: 'year', period: '2026', model: mocks.year },
  { get: month, type: 'month', period: '2026-10', model: mocks.month },
  { get: week, type: 'week', period: '2026-43', model: mocks.week },
  { get: day, type: 'day', period: '2026-10-30', model: mocks.day },
];

describe('cost drill-down routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ profile: { role: 'admin' } });
    mocks.admin.mockReturnValue(true);
    for (const route of routes) route.model.mockResolvedValue([{ id: 'order-1' }]);
    mocks.costItems.mockResolvedValue([{ category_name: 'Kip Commission', amount: 125 }]);
  });

  it.each(routes)('returns cost orders and their cost items by $type', async ({ get, type, period, model }) => {
    const response = await get(new NextRequest(`http://localhost/api/orders/by-${type}-category?${type}=${period}&category=Kip%20Commission`));
    expect(response.status).toBe(200);
    expect(model).toHaveBeenCalledWith(period, 'Kip Commission');
    expect(mocks.costItems).toHaveBeenCalledWith('order-1');
    expect(await response.json()).toEqual([{
      id: 'order-1',
      costItems: [{ category_name: 'Kip Commission', amount: 125 }],
    }]);
  });

  it.each(routes)('rejects invalid $type periods', async ({ get, type, model }) => {
    const response = await get(new NextRequest(`http://localhost/api/orders/by-${type}-category?${type}=invalid&category=Kip`));
    expect(response.status).toBe(400);
    expect(model).not.toHaveBeenCalled();
  });

  it.each(routes)('requires authentication for $type', async ({ get, type, period, model }) => {
    mocks.session.mockResolvedValue(null);
    const response = await get(new NextRequest(`http://localhost/api/orders/by-${type}-category?${type}=${period}&category=Kip`));
    expect(response.status).toBe(401);
    expect(model).not.toHaveBeenCalled();
  });

  it.each(routes)('requires admin permissions for $type', async ({ get, type, period, model }) => {
    mocks.admin.mockReturnValue(false);
    const response = await get(new NextRequest(`http://localhost/api/orders/by-${type}-category?${type}=${period}&category=Kip`));
    expect(response.status).toBe(403);
    expect(model).not.toHaveBeenCalled();
  });
});
