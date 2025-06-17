import { NextRequest, NextResponse } from 'next/server';
import { requireAuth , isAdmin} from '@/lib/auth';
import { OrderModel } from '@/lib/models';

export async function PATCH(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { orderIds, status } = await request.json();

    // Validate input
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({
        error: 'Order IDs array is required and must not be empty' }, { status: 400 });
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json({
        error: 'Status is required and must be a string' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['Cancelled', 'Complete', 'Paid', 'Proposed', 'Scheduled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Perform bulk update
    await OrderModel.bulkUpdateStatus(orderIds, status);

    return NextResponse.json({
      message: `Successfully updated ${orderIds.length} orders to ${status}`,
      updatedCount: orderIds.length
    });
  } catch (error) {
    console.error('Error in bulk order status update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
