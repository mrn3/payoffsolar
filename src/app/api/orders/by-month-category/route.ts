import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, CostItemModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const category = searchParams.get('category');

    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Category parameter is required' }, { status: 400 });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    const orders = await OrderModel.getOrdersByMonthAndCategory(month, category);

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
    console.error('Error fetching orders by month and category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
