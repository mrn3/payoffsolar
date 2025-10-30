import { NextRequest, NextResponse } from 'next/server';
import { requireAuth , isAdmin} from '@/lib/auth';
import { OrderModel } from '@/lib/models';
import { updateInventoryForOrder, validateInventoryForOrder, restoreInventoryForOrder } from '@/lib/utils/orderProcessing';


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


    const targetStatusLower = String(status).toLowerCase();

    // Load all target orders with items
    const ordersWithItems = await Promise.all(
      orderIds.map(async (id: string) => await OrderModel.getWithItems(id))
    );

    if (targetStatusLower === 'complete') {
      // Orders transitioning to Complete (were not complete before)
      const candidates = ordersWithItems.filter(o => o && String(o.status).toLowerCase() !== 'complete');

      // Require per-item warehouse selection for each candidate order
      const ordersMissingWarehouses: string[] = [];
      for (const o of candidates) {
        const missing = (o?.items || []).some(i => !(i as any).warehouse_id);
        if (missing) ordersMissingWarehouses.push(o!.id);
      }
      if (ordersMissingWarehouses.length > 0) {
        return NextResponse.json({
          error: 'Each line item must have a warehouse_id to mark orders Complete',
          orderIds: ordersMissingWarehouses
        }, { status: 400 });
      }

      // Validate inventory per order using per-item warehouses
      const validationErrors: Record<string, string[]> = {};
      for (const o of candidates) {
        const items = (o?.items || []).map(i => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          price: Number(i.price || 0),
          warehouse_id: (i as any).warehouse_id || null
        }));
        const res = await validateInventoryForOrder(items);
        if (!res.valid) {
          validationErrors[o!.id] = res.errors;
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        return NextResponse.json({
          error: 'Insufficient inventory for one or more orders',
          details: validationErrors
        }, { status: 400 });
      }

      // Update statuses
      await OrderModel.bulkUpdateStatus(orderIds, status);

      // Decrement inventory
      for (const o of candidates) {
        const items = (o!.items || []).map(i => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          price: Number(i.price || 0),
          warehouse_id: (i as any).warehouse_id || null
        }));
        try {
          await updateInventoryForOrder(items);
        } catch (e) {
          console.error('Inventory decrement failed for order', o!.id, e);
        }
      }
    } else {
      // For other statuses: restore inventory for orders that were previously Complete
      const previouslyComplete = ordersWithItems.filter(o => o && String(o.status).toLowerCase() === 'complete');

      await OrderModel.bulkUpdateStatus(orderIds, status);

      for (const o of previouslyComplete) {
        const items = (o!.items || []).map(i => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          price: Number(i.price || 0),
          warehouse_id: (i as any).warehouse_id || null
        }));
        try {
          await restoreInventoryForOrder(items);
        } catch (e) {
          console.error('Inventory restore failed for order', o!.id, e);
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
