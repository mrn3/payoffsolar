import { NextRequest, NextResponse } from 'next/server';
import { TripModel, TripOrderModel } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { calculateRouteDistances, calculateTotalDistance, generateAppleMapsDirectionsLink, generateGoogleMapsDirectionsLink, TripStop } from '@/lib/utils/tripPlanner';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id } = await params;
    
    const trip = await TripModel.getById(id);
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Get trip orders with details
    const tripOrders = await TripOrderModel.getByTripId(id);

    // Convert to trip stops and calculate distances
    const tripStops: TripStop[] = tripOrders.map(order => ({
      orderId: order.order_id,
      contactName: order.contact_name || 'Unknown',
      address: order.contact_address || '',
      city: order.contact_city || '',
      state: order.contact_state || '',
      zip: order.contact_zip || '',
      latitude: order.contact_latitude || null,
      longitude: order.contact_longitude || null,
      total: typeof order.order_total === 'string' ? parseFloat(order.order_total) : (order.order_total || 0),
      status: order.order_status || '',
    }));

    const stopsWithDistances = calculateRouteDistances(tripStops);
    const totalDistance = calculateTotalDistance(stopsWithDistances);
    const appleMapsLink = generateAppleMapsDirectionsLink(tripStops);
    const googleMapsLink = generateGoogleMapsDirectionsLink(tripStops);

    return NextResponse.json({
      trip,
      stops: stopsWithDistances,
      totalDistance,
      appleMapsLink,
      googleMapsLink,
      summary: {
        totalStops: stopsWithDistances.length,
        stopsWithCoordinates: stopsWithDistances.filter(s => s.latitude !== null && s.longitude !== null).length,
        stopsWithoutCoordinates: stopsWithDistances.filter(s => s.latitude === null || s.longitude === null).length,
        totalRevenue: stopsWithDistances.reduce((sum, stop) => sum + stop.total, 0),
      }
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
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

    const { id } = await params;
    const body = await request.json();
    const { name, description, trip_date, status } = body;

    // Update trip
    await TripModel.update(id, {
      name,
      description,
      trip_date,
      status
    });

    const trip = await TripModel.getById(id);
    return NextResponse.json({ trip });
  } catch (error) {
    console.error('Error updating trip:', error);
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

    const { id } = await params;

    await TripModel.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
