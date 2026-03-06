'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface OrderForMap {
  id: string;
  contact_id: string;
  status: string;
  total: number | string;
  order_date: string;
  contact_name?: string;
  contact_city?: string;
  contact_state?: string;
  contact_address?: string;
  contact_latitude?: number | null;
  contact_longitude?: number | null;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'complete': return '#16a34a';
    case 'paid': return '#9333ea';
    case 'cancelled': return '#dc2626';
    case 'proposed': return '#eab308';
    case 'scheduled': return '#2563eb';
    default: return '#6b7280';
  }
}

function getRadiusForTotal(total: number, minTotal: number, maxTotal: number): number {
  const minRadius = 8;
  const maxRadius = 32;
  if (maxTotal <= minTotal) return (minRadius + maxRadius) / 2;
  const ratio = (total - minTotal) / (maxTotal - minTotal);
  return minRadius + ratio * (maxRadius - minRadius);
}

interface OrdersMapProps {
  orders: OrderForMap[];
}

export default function OrdersMap({ orders }: OrdersMapProps) {
  const points = useMemo(() => {
    const result: Array<{ order: OrderForMap; lat: number; lng: number }> = [];
    const seen = new Map<string, number>();
    for (const order of orders) {
      const lat = order.contact_latitude != null ? Number(order.contact_latitude) : null;
      const lng = order.contact_longitude != null ? Number(order.contact_longitude) : null;
      if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) continue;
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      const count = (seen.get(key) ?? 0);
      seen.set(key, count + 1);
      const offset = count > 0
        ? { lat: (count % 3 - 1) * 0.002, lng: Math.floor(count / 3) * 0.002 }
        : { lat: 0, lng: 0 };
      result.push({ order, lat: lat + offset.lat, lng: lng + offset.lng });
    }
    return result;
  }, [orders]);

  const totals = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 0 };
    const t = points.map(p => Number(p.order.total));
    return { min: Math.min(...t), max: Math.max(...t) };
  }, [points]);

  const center: [number, number] = points.length
    ? [
        points.reduce((s, p) => s + p.lat, 0) / points.length,
        points.reduce((s, p) => s + p.lng, 0) / points.length
      ]
    : [39.8283, -98.5795];

  const ordersWithCoords = points.length;
  const ordersWithoutCoords = orders.filter(
    o => o.contact_latitude == null || o.contact_longitude == null
  ).length;

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white p-8 text-center text-gray-500">
        No orders to display on the map. Adjust filters or add orders.
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white p-8 text-center max-w-xl mx-auto">
        <p className="text-gray-700 font-medium">No locations to show on the map.</p>
        <p className="text-gray-500 text-sm mt-2">
          Orders appear on the map only when their contact has latitude/longitude saved. For existing contacts, run the backfill script once from your project root (in a terminal). It geocodes each contact and may take a few minutes for hundreds of contacts:
        </p>
        <code className="mt-3 block text-left bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 font-mono">
          node scripts/backfill-contact-coordinates.js
        </code>
        <p className="text-gray-500 text-xs mt-3">
          New or edited contacts are geocoded automatically when you save their address.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      {ordersWithoutCoords > 0 && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
          {ordersWithCoords} order{ordersWithCoords !== 1 ? 's' : ''} on map.
          {ordersWithoutCoords > 0 && (
            <> {ordersWithoutCoords} order{ordersWithoutCoords !== 1 ? 's' : ''} have no contact coordinates (edit contact address to geocode).</>
          )}
        </div>
      )}
      <div className="h-[500px] w-full relative z-0">
        <MapContainer
          key="orders-map"
          center={center}
          zoom={points.length <= 1 ? 4 : 8}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {points.map(({ order, lat, lng }) => (
            <CircleMarker
              key={order.id}
              center={[lat, lng]}
              pathOptions={{
                fillColor: getStatusColor(order.status),
                color: '#111827',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85
              }}
              radius={Math.max(10, getRadiusForTotal(Number(order.total), totals.min, totals.max))}
            >
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <div className="font-medium text-gray-900">
                    <Link href={`/dashboard/orders/${order.id}`} className="text-green-600 hover:underline">
                      Order #{order.id.substring(0, 8)}
                    </Link>
                  </div>
                  {order.contact_name && (
                    <div className="text-gray-600">{order.contact_name}</div>
                  )}
                  <div className="text-gray-500 mt-1">
                    {[order.contact_city, order.contact_state].filter(Boolean).join(', ')}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    />
                    <span className="text-gray-700">{order.status}</span>
                  </div>
                  <div className="font-medium text-gray-900 mt-1">
                    ${Number(order.total).toFixed(2)}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {format(new Date(order.order_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="font-medium">Status:</span>
        {['Complete', 'Paid', 'Scheduled', 'Proposed', 'Cancelled'].map(s => (
          <span key={s} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: getStatusColor(s) }}
            />
            {s}
          </span>
        ))}
        <span className="ml-4 font-medium">Circle size = order total</span>
      </div>
    </div>
  );
}
