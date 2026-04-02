import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { calculateRouteDistances, calculateTotalDistance, generateGoogleMapsDirectionsLink, TripStop } from '@/lib/utils/tripPlanner';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    const body = await request.json();
    const { orderIds } = body;

    // Validate input
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs array is required' },
        { status: 400 }
      );
    }

    // Fetch orders with contact details
    const orders = await Promise.all(
      orderIds.map(async (orderId: string) => {
        const order = await OrderModel.getWithItems(orderId);
        return order;
      })
    );

    // Filter out null orders (not found)
    const validOrders = orders.filter(order => order !== null);

    if (validOrders.length === 0) {
      return NextResponse.json(
        { error: 'No valid orders found' },
        { status: 404 }
      );
    }

    // Convert orders to trip stops
    const tripStops: TripStop[] = validOrders.map(order => ({
      orderId: order.id,
      contactName: order.contact_name || 'Unknown',
      address: order.contact_address || '',
      city: order.contact_city || '',
      state: order.contact_state || '',
      zip: order.contact_zip || '',
      latitude: order.contact_latitude || null,
      longitude: order.contact_longitude || null,
      total: typeof order.total === 'string' ? parseFloat(order.total) : order.total,
      status: order.status,
    }));

    // Calculate distances for the route
    const stopsWithDistances = calculateRouteDistances(tripStops);
    const totalDistance = calculateTotalDistance(stopsWithDistances);

    // Generate Google Maps directions link for the entire route
    const directionsLink = generateGoogleMapsDirectionsLink(tripStops);

    return NextResponse.json({
      stops: stopsWithDistances,
      totalDistance,
      directionsLink,
      summary: {
        totalStops: stopsWithDistances.length,
        stopsWithCoordinates: stopsWithDistances.filter(s => s.latitude !== null && s.longitude !== null).length,
        stopsWithoutCoordinates: stopsWithDistances.filter(s => s.latitude === null || s.longitude === null).length,
        totalRevenue: stopsWithDistances.reduce((sum, stop) => sum + stop.total, 0),
      }
    });
  } catch (error) {
    console.error('Error calculating trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
