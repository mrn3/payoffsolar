import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '31');
    const categoryId = searchParams.get('categoryId');

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: 'Invalid days parameter. Must be between 1 and 365' }, { status: 400 });
    }

    const costBreakdownData = await OrderModel.getCostBreakdownByDay(days, categoryId);
    return NextResponse.json(costBreakdownData);
  } catch (error) {
    console.error('Error fetching cost breakdown by day:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
