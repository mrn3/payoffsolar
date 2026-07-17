import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { calculateRouteDistances, calculateTotalDistance, generateAppleMapsDirectionsLink, TripStop } from '@/lib/utils/tripPlanner';
import { executeQuery } from '@/lib/mysql/connection';

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

    // Generate Apple Maps directions link for the entire route
    const directionsLink = generateAppleMapsDirectionsLink(tripStops);

    // Fetch per-order panel breakdown by product type and inverter counts
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
      stops: enrichedStops,
      totalDistance,
      directionsLink,
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
    console.error('Error calculating trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
