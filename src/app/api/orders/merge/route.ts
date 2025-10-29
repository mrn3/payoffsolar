import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, OrderItemModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { executeSingle } from '@/lib/mysql/connection';
import { smartMergeOrders } from '@/lib/utils/duplicates';
import { updateInventoryForOrder } from '@/lib/utils/orderProcessing';


interface MergeRequest {
  primaryOrderId: string;
  duplicateOrderId: string;
  mergedData?: {
    contact_id: string;
    status: string;
    total: number;
    order_date: string;
    notes?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { primaryOrderId, duplicateOrderId, mergedData }: MergeRequest = await request.json();

    // Validate input
    if (!primaryOrderId || !duplicateOrderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (primaryOrderId === duplicateOrderId) {
      return NextResponse.json({ error: 'Cannot merge an order with itself' }, { status: 400 });
    }

    // Get both orders to verify they exist
    const primaryOrder = await OrderModel.getById(primaryOrderId);
    const duplicateOrder = await OrderModel.getById(duplicateOrderId);

    if (!primaryOrder || !duplicateOrder) {
      return NextResponse.json({ error: 'One or both orders not found' }, { status: 404 });
    }


	    // Track if the primary order was already complete before merge
	    const wasComplete = (primaryOrder.status || '').toLowerCase() === 'complete';

    // Start transaction-like operations
    try {
      // 1. Get all order items from the duplicate order
      const duplicateOrderItems = await OrderItemModel.getByOrderId(duplicateOrderId);

      // 2. Transfer order items from duplicate order to primary order
      for (const item of duplicateOrderItems) {
        // Check if the primary order already has an item with the same product
        const existingItems = await OrderItemModel.getByOrderId(primaryOrderId);
        const existingItem = existingItems.find(existing => existing.product_id === item.product_id);

        if (existingItem) {
          // If product already exists, combine quantities and use the higher price
          const newQuantity = existingItem.quantity + item.quantity;
          const newPrice = Math.max(Number(existingItem.price), Number(item.price));

          await OrderItemModel.update(existingItem.id, {
            quantity: newQuantity,
            price: newPrice
          });
        } else {
          // If product doesn't exist, create new order item for primary order
          await OrderItemModel.create({
            order_id: primaryOrderId,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          });
        }
      }

      // 3. Generate smart merged data if not provided
      const finalMergedData = mergedData || smartMergeOrders(primaryOrder, duplicateOrder);

      // 4. Update the primary order with merged data
      await OrderModel.update(primaryOrderId, {
        contact_id: finalMergedData.contact_id,
        status: finalMergedData.status,
        total: finalMergedData.total,
        order_date: finalMergedData.order_date,
        notes: finalMergedData.notes
      });

	      // If transitioned to Complete during merge, decrement inventory for primary order
	      try {
	        const isNowComplete = (finalMergedData.status || '').toLowerCase() === 'complete';
	        if (isNowComplete && !wasComplete) {
	          const orderForInventory = await OrderModel.getWithItems(primaryOrderId);
	          const items = (orderForInventory?.items || []).map((i) => ({
	            product_id: i.product_id,
	            quantity: Number(i.quantity),
	            price: Number(i.price || 0)
	          }));
	          if (items.length > 0) {
	            await updateInventoryForOrder(items);
	          }
	        }
	      } catch (e) {
	        console.error('Inventory adjustment on merge completion failed:', e);
	      }


      // 5. Delete the duplicate order (this will cascade delete its items)
      await OrderModel.delete(duplicateOrderId);

      // 6. Get the updated primary order with items
      const updatedOrder = await OrderModel.getWithItems(primaryOrderId);

      return NextResponse.json({
        success: true,
        mergedOrder: updatedOrder,
        message: 'Orders merged successfully'
      });

    } catch (mergeError) {
      console.error('Error during merge operation:', mergeError);
      return NextResponse.json({
        error: 'Failed to merge orders. Please try again.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error merging orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
