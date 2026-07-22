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
      contactId: order.contact_id,
      contactName: order.contact_name || 'Unknown',
      contactPhone: order.contact_phone || undefined,
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

    // Fetch per-order panel breakdown by product type and inverter counts
    const orderIds = tripOrders.map(o => o.order_id);
    const panelsByTypeMap = new Map<string, { name: string; quantity: number }[]>();
    const inverterCountMap = new Map<string, number>();
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(', ');

      const panelRows = await executeQuery<{ order_id: string; product_name: string; quantity: number }>(
        `SELECT oi.order_id, p.name as product_name, SUM(oi.quantity) as quantity
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN product_categories pc ON p.category_id = pc.id
         WHERE pc.slug = 'solar-panels' AND oi.order_id IN (${placeholders})
         GROUP BY oi.order_id, p.id, p.name
         ORDER BY p.name`,
        orderIds
      );
      for (const row of panelRows) {
        const existing = panelsByTypeMap.get(row.order_id) ?? [];
        existing.push({ name: row.product_name, quantity: Number(row.quantity) });
        panelsByTypeMap.set(row.order_id, existing);
      }

      const inverterRows = await executeQuery<{ order_id: string; inverters: number }>(
        `SELECT oi.order_id, COALESCE(SUM(oi.quantity), 0) as inverters
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN product_categories pc ON p.category_id = pc.id
         WHERE pc.slug = 'inverters' AND oi.order_id IN (${placeholders})
         GROUP BY oi.order_id`,
        orderIds
      );
      for (const row of inverterRows) {
        inverterCountMap.set(row.order_id, Number(row.inverters));
      }
    }

    // Enrich each stop with panel breakdown and inverter count
    const enrichedStops = stopsWithDistances.map(stop => ({
      ...stop,
      panelsByType: panelsByTypeMap.get(stop.orderId) ?? [],
      inverters: inverterCountMap.get(stop.orderId) ?? 0,
    }));

    const totalPanels = enrichedStops.reduce(
      (sum, s) => sum + s.panelsByType.reduce((t, p) => t + p.quantity, 0), 0
    );
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
