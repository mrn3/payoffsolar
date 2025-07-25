import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, CostItemModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const category = searchParams.get('category');

    if (!week) {
      return NextResponse.json({ error: 'Week parameter is required' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
    }

    // Validate week format (YYYY-WW)
    const weekRegex = /^\d{4}-\d{1,2}$/;
    if (!weekRegex.test(week)) {
      return NextResponse.json({ error: 'Invalid week format. Use YYYY-WW' }, { status: 400 });
    }

    const orders = await OrderModel.getOrdersByWeekAndCategory(week, category);

    // Add cost breakdown details for each order
    const ordersWithCostBreakdown = await Promise.all(
      orders.map(async (order) => {
        const costItems = await CostItemModel.getByOrderId(order.id);
        return {
          ...order,
          costItems
        };
      })
    );

    return NextResponse.json(ordersWithCostBreakdown);
  } catch (error) {
    console.error('Error fetching orders by week and category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
