import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    // Validate months parameter
    if (isNaN(months) || months < 1 || months > 60) {
      return NextResponse.json({ error: 'Invalid months parameter. Must be between 1 and 60' }, { status: 400 });
    }

    const costBreakdownData = await OrderModel.getCostBreakdownByMonth(months);
    return NextResponse.json(costBreakdownData);
  } catch (error) {
    console.error('Error fetching cost breakdown by month:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
