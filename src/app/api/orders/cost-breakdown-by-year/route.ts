import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const years = parseInt(searchParams.get('years') || '5');
    const categoryId = searchParams.get('categoryId');

    // Validate years parameter
    if (isNaN(years) || years < 1 || years > 10) {
      return NextResponse.json({ error: 'Invalid years parameter. Must be between 1 and 10' }, { status: 400 });
    }

    const costBreakdownData = await OrderModel.getCostBreakdownByYear(years, categoryId);
    return NextResponse.json(costBreakdownData);
  } catch (error) {
    console.error('Error fetching cost breakdown by year:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
