import { NextRequest, NextResponse } from 'next/server';
import { TripModel, TripOrderModel } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { calculateRouteDistances, calculateTotalDistance, generateAppleMapsDirectionsLink, generateGoogleMapsDirectionsLink, TripStop } from '@/lib/utils/tripPlanner';
import { executeQuery } from '@/lib/mysql/connection';

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

    // Fetch per-order solar panel and inverter counts
    const orderIds = tripOrders.map(o => o.order_id);
    const stopProductMap = new Map<string, { panels: number; inverters: number }>();
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(', ');
      const perOrderCounts = await executeQuery<{ order_id: string; panels: number; inverters: number }>(
        `SELECT
          oi.order_id,
          COALESCE(SUM(CASE WHEN pc.slug = 'solar-panels' THEN oi.quantity ELSE 0 END), 0) as panels,
          COALESCE(SUM(CASE WHEN pc.slug = 'inverters' THEN oi.quantity ELSE 0 END), 0) as inverters
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN product_categories pc ON p.category_id = pc.id
         WHERE oi.order_id IN (${placeholders})
         GROUP BY oi.order_id`,
        orderIds
      );
      for (const row of perOrderCounts) {
        stopProductMap.set(row.order_id, { panels: Number(row.panels), inverters: Number(row.inverters) });
      }
    }

    // Enrich each stop with its panel/inverter counts
    const enrichedStops = stopsWithDistances.map(stop => ({
      ...stop,
      panels: stopProductMap.get(stop.orderId)?.panels ?? 0,
      inverters: stopProductMap.get(stop.orderId)?.inverters ?? 0,
    }));

    const totalPanels = enrichedStops.reduce((sum, s) => sum + s.panels, 0);
    const totalInverters = enrichedStops.reduce((sum, s) => sum + s.inverters, 0);

    return NextResponse.json({
      trip,
      stops: enrichedStops,
      totalDistance,
      appleMapsLink,
      googleMapsLink,
      summary: {
        totalStops: enrichedStops.length,
        stopsWithCoordinates: enrichedStops.filter(s => s.latitude !== null && s.longitude !== null).length,
        stopsWithoutCoordinates: enrichedStops.filter(s => s.latitude === null || s.longitude === null).length,
        totalRevenue: enrichedStops.reduce((sum, stop) => sum + stop.total, 0),
        totalPanels,
        totalInverters,
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
