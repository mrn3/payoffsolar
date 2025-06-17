import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { findOrderDuplicates } from '@/lib/utils/duplicates';

interface BulkFindDuplicatesRequest {
  orderIds: string[];
  threshold?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { orderIds, threshold = 70 }: BulkFindDuplicatesRequest = await request.json();

    // Validate input
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({
        error: 'Order IDs array is required and must not be empty'
      }, { status: 400 });
    }

    if (orderIds.length < 2) {
      return NextResponse.json({
        duplicateGroups: [],
        totalGroups: 0,
        totalDuplicateOrders: 0,
        message: 'At least 2 orders are required to find duplicates'
      });
    }

    // Get the selected orders
    const orders = [];
    const notFoundIds = [];

    for (const orderId of orderIds) {
      try {
        // Get order with contact information
        const orderWithItems = await OrderModel.getWithItems(orderId);
        if (orderWithItems) {
          orders.push(orderWithItems);
        } else {
          notFoundIds.push(orderId);
        }
      } catch (error) {
        console.error(`Error fetching order ${orderId}:`, error);
        notFoundIds.push(orderId);
      }
    }

    if (orders.length < 2) {
      return NextResponse.json({
        duplicateGroups: [],
        totalGroups: 0,
        totalDuplicateOrders: 0,
        message: 'At least 2 valid orders are required to find duplicates',
        notFoundIds
      });
    }

    // Find duplicates among the selected orders
    const duplicateGroups = findOrderDuplicates(orders, threshold);

    const response: any = {
      duplicateGroups,
      totalGroups: duplicateGroups.length,
      totalDuplicateOrders: duplicateGroups.reduce((sum, group) => sum + group.orders.length, 0),
      totalOrdersChecked: orders.length,
      threshold
    };

    if (notFoundIds.length > 0) {
      response.notFoundIds = notFoundIds;
      response.warning = `${notFoundIds.length} order${notFoundIds.length !== 1 ? 's' : ''} could not be found`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in bulk find duplicates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
