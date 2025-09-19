import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timePeriod = searchParams.get('timePeriod') || 'month';

    let unitsSoldData;

    switch (timePeriod) {
      case 'year':
        const years = parseInt(searchParams.get('years') || '5');
        if (years < 1 || years > 10) {
          return NextResponse.json({ error: 'Years must be between 1 and 10' }, { status: 400 });
        }
        unitsSoldData = await OrderModel.getUnitsSoldByYearAndCategory(years);
        break;

      case 'month':
        const months = parseInt(searchParams.get('months') || '12');
        if (months < 1 || months > 24) {
          return NextResponse.json({ error: 'Months must be between 1 and 24' }, { status: 400 });
        }
        unitsSoldData = await OrderModel.getUnitsSoldByMonthAndCategory(months);
        break;

      case 'week':
        const weeks = parseInt(searchParams.get('weeks') || '20');
        if (weeks < 1 || weeks > 52) {
          return NextResponse.json({ error: 'Weeks must be between 1 and 52' }, { status: 400 });
        }
        unitsSoldData = await OrderModel.getUnitsSoldByWeekAndCategory(weeks);
        break;

      case 'day':
        const days = parseInt(searchParams.get('days') || '31');
        if (days < 1 || days > 365) {
          return NextResponse.json({ error: 'Days must be between 1 and 365' }, { status: 400 });
        }
        unitsSoldData = await OrderModel.getUnitsSoldByDayAndCategory(days);
        break;

      default:
        return NextResponse.json({ error: 'Invalid timePeriod. Must be year, month, week, or day' }, { status: 400 });
    }

    return NextResponse.json(unitsSoldData);
  } catch (error) {
    console.error('Error fetching units sold by category data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
