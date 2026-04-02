import { NextRequest, NextResponse } from 'next/server';
import { TripOrderModel } from '@/lib/models';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id: tripId } = await params;
    const body = await request.json();
    const { orderIds } = body;

    // Validate input
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs array is required' },
        { status: 400 }
      );
    }

    // Add orders to trip with sequence
    const addedOrders = [];
    for (let i = 0; i < orderIds.length; i++) {
      try {
        const tripOrderId = await TripOrderModel.addOrder(tripId, orderIds[i], i);
        addedOrders.push(tripOrderId);
      } catch (error) {
        // Skip if order already exists in trip
        console.warn(`Order ${orderIds[i]} already in trip or error:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      addedCount: addedOrders.length
    });
  } catch (error) {
    console.error('Error adding orders to trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id: tripId } = await params;
    const body = await request.json();
    const { orderSequences } = body;

    // Validate input
    if (!orderSequences || !Array.isArray(orderSequences)) {
      return NextResponse.json(
        { error: 'Order sequences array is required' },
        { status: 400 }
      );
    }

    // Update sequences
    await TripOrderModel.updateAllSequences(tripId, orderSequences);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order sequences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id: tripId } = await params;
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    await TripOrderModel.removeOrder(tripId, orderId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing order from trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
