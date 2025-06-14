import { NextRequest, NextResponse } from 'next/server';
import { requireAuth , isAdmin} from '@/lib/auth';

export async function PATCH(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _orderIds, status } = await request.json();

    // Validate input
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ 
        _error: 'Order IDs array is required and must not be empty' }, { status: 400 });
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json({ 
        _error: 'Status is required and must be a string' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json({ 
        _error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    // Perform bulk update
    await OrderModel.bulkUpdateStatus(orderIds, status);

    return NextResponse.json({ 
      message: `Successfully updated ${orderIds.length} orders to ${status}`,
      updatedCount: orderIds.length 
    });
  } catch (_error) {
    console.error('Error in bulk order status update:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
