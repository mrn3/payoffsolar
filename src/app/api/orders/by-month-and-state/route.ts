import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const state = searchParams.get('state');

    if (!month || !state) {
      return NextResponse.json({ error: 'Month and state parameters are required' }, { status: 400 });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    const orders = await OrderModel.getOrdersByMonthAndState(month, state);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders by month and state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
