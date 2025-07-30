import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    // Validate months parameter
    if (months < 1 || months > 24) {
      return NextResponse.json({ error: 'Months must be between 1 and 24' }, { status: 400 });
    }

    const revenueData = await OrderModel.getRevenueByMonthAndState(months);
    return NextResponse.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue by state data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
