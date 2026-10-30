import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, CostItemModel } from '@/lib/models';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const category = searchParams.get('category');

    if (!year || !category) {
      return NextResponse.json({ error: 'Year and category parameters are required' }, { status: 400 });
    }
    if (!/^\d{4}$/.test(year)) {
      return NextResponse.json({ error: 'Invalid year format. Use YYYY' }, { status: 400 });
    }

    const orders = await OrderModel.getOrdersByYearAndCostCategory(year, category);
    const ordersWithCostBreakdown = await Promise.all(
      orders.map(async (order) => ({
        ...order,
        costItems: await CostItemModel.getByOrderId(order.id),
      }))
    );

    return NextResponse.json(ordersWithCostBreakdown);
  } catch (error) {
    console.error('Error fetching orders by year and category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
