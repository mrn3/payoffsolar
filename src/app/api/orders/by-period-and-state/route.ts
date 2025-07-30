import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timePeriod = searchParams.get('timePeriod');
    const period = searchParams.get('period');
    const state = searchParams.get('state');
    const categoryId = searchParams.get('categoryId');

    if (!timePeriod || !period || !state) {
      return NextResponse.json({ error: 'timePeriod, period, and state parameters are required' }, { status: 400 });
    }

    let orders;

    switch (timePeriod) {
      case 'month':
        // Validate month format (YYYY-MM)
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(period)) {
          return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
        }
        orders = await OrderModel.getOrdersByMonthAndState(period, state, categoryId);
        break;
      
      case 'week':
        // Validate week format (YYYY-WW)
        const weekRegex = /^\d{4}-\d{1,2}$/;
        if (!weekRegex.test(period)) {
          return NextResponse.json({ error: 'Invalid week format. Use YYYY-WW' }, { status: 400 });
        }
        orders = await OrderModel.getOrdersByWeekAndState(period, state, categoryId);
        break;
      
      case 'day':
        // Validate day format (YYYY-MM-DD)
        const dayRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dayRegex.test(period)) {
          return NextResponse.json({ error: 'Invalid day format. Use YYYY-MM-DD' }, { status: 400 });
        }
        orders = await OrderModel.getOrdersByDayAndState(period, state, categoryId);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid timePeriod. Must be month, week, or day' }, { status: 400 });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders by period and state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
