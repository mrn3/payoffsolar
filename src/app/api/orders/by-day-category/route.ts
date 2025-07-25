import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, CostItemModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day');
    const category = searchParams.get('category');

    if (!day) {
      return NextResponse.json({ error: 'Day parameter is required' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
    }

    // Validate day format (YYYY-MM-DD)
    const dayRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dayRegex.test(day)) {
      return NextResponse.json({ error: 'Invalid day format. Use YYYY-MM-DD' }, { status: 400 });
    }

    const orders = await OrderModel.getOrdersByDayAndCategory(day, category);

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
    console.error('Error fetching orders by day and category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
