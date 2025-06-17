import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { findOrderDuplicates } from '@/lib/utils/duplicates';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold') || '70');

    // Get all orders for duplicate detection
    const allOrders = await OrderModel.getAll(10000, 0); // Get a large number to include all orders

    // Find duplicates
    const duplicateGroups = findOrderDuplicates(allOrders, threshold);

    return NextResponse.json({
      duplicateGroups,
      totalGroups: duplicateGroups.length,
      totalDuplicateOrders: duplicateGroups.reduce((sum, group) => sum + group.orders.length, 0)
    });

  } catch (error) {
    console.error('Error finding order duplicates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
