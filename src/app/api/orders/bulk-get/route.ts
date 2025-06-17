import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

interface BulkGetRequest {
  orderIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { orderIds }: BulkGetRequest = await request.json();

    // Validate input
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({
        error: 'Order IDs array is required and must not be empty'
      }, { status: 400 });
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

    const response: any = {
      orders,
      totalOrders: orders.length,
      requestedCount: orderIds.length
    };

    if (notFoundIds.length > 0) {
      response.notFoundIds = notFoundIds;
      response.warning = `${notFoundIds.length} order${notFoundIds.length !== 1 ? 's' : ''} could not be found`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in bulk get orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
