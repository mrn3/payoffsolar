import { NextRequest, NextResponse } from 'next/server';
import { DashboardTimePeriod, OrderModel } from '@/lib/models';

const periodSettings: Record<DashboardTimePeriod, { parameter: string; defaultValue: number; maximum: number }> = {
  year: { parameter: 'years', defaultValue: 5, maximum: 10 },
  month: { parameter: 'months', defaultValue: 12, maximum: 24 },
  week: { parameter: 'weeks', defaultValue: 20, maximum: 52 },
  day: { parameter: 'days', defaultValue: 31, maximum: 365 },
  yoy: { parameter: 'years', defaultValue: 3, maximum: 10 },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timePeriod = searchParams.get('timePeriod') || 'month';

    if (!(timePeriod in periodSettings)) {
      return NextResponse.json(
        { error: 'Invalid timePeriod. Must be year, month, week, day, or yoy' },
        { status: 400 }
      );
    }

    const typedPeriod = timePeriod as DashboardTimePeriod;
    const setting = periodSettings[typedPeriod];
    const periodCount = parseInt(
      searchParams.get(setting.parameter) || String(setting.defaultValue),
      10
    );

    if (isNaN(periodCount) || periodCount < 1 || periodCount > setting.maximum) {
      return NextResponse.json(
        { error: `${setting.parameter} must be between 1 and ${setting.maximum}` },
        { status: 400 }
      );
    }

    const productId = searchParams.get('productId');
    const rows = await OrderModel.getProductUnitsByStatus(typedPeriod, periodCount, productId);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching product units by status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}