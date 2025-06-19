import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status parameter is required' }, { status: 400 });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['Cancelled', 'Complete', 'Paid', 'Proposed', 'Scheduled', 'Followed Up'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const orders = await OrderModel.getOrdersByMonthAndStatus(month, status);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders by month and status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
