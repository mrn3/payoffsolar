import { NextRequest, NextResponse } from 'next/server';
import { requireAuth , isAdmin} from '@/lib/auth';
import { OrderModel } from '@/lib/models';
import { updateInventoryForOrder } from '@/lib/utils/orderProcessing';


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


	    // Determine which orders need inventory adjustment (transition to Complete)
	    const targetStatusLower = String(status).toLowerCase();
	    let ordersNeedingAdjustment: string[] = [];
	    if (targetStatusLower === 'complete') {
	      const priorStatuses = await Promise.all(
	        orderIds.map(async (id: string) => {
	          const o = await OrderModel.getById(id);
	          return { id, status: (o?.status || '').toLowerCase() };
	        })
	      );
	      ordersNeedingAdjustment = priorStatuses
	        .filter(o => o.status !== 'complete')
	        .map(o => o.id);
	    }

    // Perform bulk update
    await OrderModel.bulkUpdateStatus(orderIds, status);

	    // If status set to Complete, decrement inventory for affected orders
	    if (targetStatusLower === 'complete' && ordersNeedingAdjustment.length > 0) {
	      for (const id of ordersNeedingAdjustment) {
	        try {
	          const order = await OrderModel.getWithItems(id);
	          const items = (order?.items || []).map((i) => ({
	            product_id: i.product_id,
	            quantity: Number(i.quantity),
	            price: Number(i.price || 0)
	          }));
	          if (items.length > 0) {
	            await updateInventoryForOrder(items);
	          }
	        } catch (e) {
	          console.error('Inventory adjustment failed for order', id, e);
	        }
	      }
	    }


    return NextResponse.json({
      message: `Successfully updated ${orderIds.length} orders to ${status}`,
      updatedCount: orderIds.length
    });
  } catch (error) {
    console.error('Error in bulk order status update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
