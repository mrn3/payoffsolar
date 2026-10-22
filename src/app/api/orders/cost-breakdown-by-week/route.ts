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
    const weeks = parseInt(searchParams.get('weeks') || '20');
    const categoryId = searchParams.get('categoryId');

    // Validate weeks parameter
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      return NextResponse.json({ error: 'Invalid weeks parameter. Must be between 1 and 52' }, { status: 400 });
    }

    const costBreakdownData = await OrderModel.getCostBreakdownByWeek(weeks, categoryId);
    return NextResponse.json(costBreakdownData);
  } catch (error) {
    console.error('Error fetching cost breakdown by week:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
