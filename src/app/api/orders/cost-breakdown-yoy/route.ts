import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const years = parseInt(searchParams.get('years') || '3');
    const categoryId = searchParams.get('categoryId');

    if (isNaN(years) || years < 1 || years > 10) {
      return NextResponse.json({ error: 'Invalid years parameter. Must be between 1 and 10' }, { status: 400 });
    }

    const costBreakdownData = await OrderModel.getCostBreakdownByMonthYoY(years, categoryId);
    return NextResponse.json(costBreakdownData);
  } catch (error) {
    console.error('Error fetching cost breakdown year-over-year:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
