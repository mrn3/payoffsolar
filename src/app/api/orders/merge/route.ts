import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, OrderItemModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { executeSingle } from '@/lib/mysql/connection';
import { smartMergeOrders } from '@/lib/utils/duplicates';
import { updateInventoryForOrder, validateInventoryForOrder, restoreInventoryForOrder } from '@/lib/utils/orderProcessing';


interface MergeRequest {
  primaryOrderId: string;
  duplicateOrderId: string;
  mergedData?: {
    contact_id: string;
    status: string;
    total: number;
    order_date: string;
    notes?: string;
    warehouse_id?: string;
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
        // Only merge if both product_id AND warehouse_id match; otherwise create a separate line
        const existingItem = existingItems.find(existing => existing.product_id === item.product_id && (existing as any).warehouse_id === (item as any).warehouse_id);

        if (existingItem) {
          // If same product and warehouse, combine quantities and use the higher price
          const newQuantity = existingItem.quantity + item.quantity;
          const newPrice = Math.max(Number(existingItem.price), Number(item.price));

          await OrderItemModel.update(existingItem.id, {
            quantity: newQuantity,
            price: newPrice
          });
        } else {
          // Otherwise, create a separate line item and preserve the item's warehouse
          await OrderItemModel.create({
            order_id: primaryOrderId,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            warehouse_id: (item as any).warehouse_id || null
          });
        }
      }

      // 3. Generate smart merged data if not provided
      const mergedCandidate = mergedData || smartMergeOrders(primaryOrder, duplicateOrder);

      // Determine merge status transition and validate if moving to Complete
      const targetIsComplete = (mergedCandidate.status || '').toLowerCase() === 'complete';

      if (targetIsComplete && !wasComplete) {
        const orderForInventory = await OrderModel.getWithItems(primaryOrderId);
        const itemsForValidation = (orderForInventory?.items || []).map(i => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          price: Number(i.price || 0),
          warehouse_id: (i as any).warehouse_id || null
        }));
        const missingWarehouse = itemsForValidation.find((it: any) => !it.warehouse_id);
        if (missingWarehouse) {
          return NextResponse.json({ error: 'Each line item must have a warehouse_id to mark merged order Complete' }, { status: 400 });
        }
        const validation = await validateInventoryForOrder(itemsForValidation);
        if (!validation.valid) {
          return NextResponse.json({ error: 'Insufficient inventory', details: validation.errors }, { status: 400 });
        }
      }

      const finalMergedData = mergedCandidate;

      // 4. Update the primary order with merged data (no order-level warehouse)
      await OrderModel.update(primaryOrderId, {
        contact_id: finalMergedData.contact_id,
        status: finalMergedData.status,
        total: finalMergedData.total,
        order_date: finalMergedData.order_date,
        notes: finalMergedData.notes
      });

      // Post-update inventory adjustments for merge
      try {
        const isNowComplete = (finalMergedData.status || '').toLowerCase() === 'complete';
        if (isNowComplete && !wasComplete) {
          const orderForInventory = await OrderModel.getWithItems(primaryOrderId);
          const items = (orderForInventory?.items || []).map((i) => ({
            product_id: i.product_id,
            quantity: Number(i.quantity),
            price: Number(i.price || 0),
            warehouse_id: (i as any).warehouse_id || null
          }));
          if (items.length > 0) {
            await updateInventoryForOrder(items);
          }
        } else if (!isNowComplete && wasComplete) {
          const orderForInventory = await OrderModel.getWithItems(primaryOrderId);
          const items = (orderForInventory?.items || []).map((i) => ({
            product_id: i.product_id,
            quantity: Number(i.quantity),
            price: Number(i.price || 0),
            warehouse_id: (i as any).warehouse_id || null
          }));
          if (items.length > 0) {
            await restoreInventoryForOrder(items);
          }
        }
      } catch (e) {
        console.error('Inventory adjustment on merge failed:', e);
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
