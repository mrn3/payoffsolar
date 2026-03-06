'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
}

const NOMINATIM_DELAY_MS = 1100; // Nominatim allows 1 req/sec
const MAP_ORDER_LIMIT = 100;

function buildAddressString(order: OrderForMap): string {
  const parts = [
    order.contact_address,
    order.contact_city,
    order.contact_state
  ].filter(Boolean);
  return parts.join(', ') || '';
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

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1'
  })}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PayoffSolar-OrdersMap/1.0' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

interface OrdersMapProps {
  orders: OrderForMap[];
  onGeocodeProgress?: (current: number, total: number) => void;
}

export default function OrdersMap({ orders, onGeocodeProgress }: OrdersMapProps) {
  const [points, setPoints] = useState<Array<{
    order: OrderForMap;
    lat: number;
    lng: number;
  }>>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState<{ current: number; total: number } | null>(null);

  const ordersToShow = useMemo(() => orders.slice(0, MAP_ORDER_LIMIT), [orders]);
  const uniqueAddresses = useMemo(() => {
    const out: { address: string; orders: OrderForMap[] }[] = [];
    for (const order of ordersToShow) {
      const addr = buildAddressString(order);
      if (!addr.trim()) continue;
      const existing = out.find(x => x.address === addr);
      if (existing) existing.orders.push(order);
      else out.push({ address: addr, orders: [order] });
    }
    return out;
  }, [ordersToShow]);

  useEffect(() => {
    let cancelled = false;
    const cache = new Map<string, { lat: number; lng: number }>();

    (async () => {
      setGeocoding(true);
      const results: Array<{ order: OrderForMap; lat: number; lng: number }> = [];
      const total = uniqueAddresses.length;
      for (let i = 0; i < uniqueAddresses.length; i++) {
        if (cancelled) break;
        const { address, orders: group } = uniqueAddresses[i];
        setGeocodeProgress({ current: i + 1, total });
        onGeocodeProgress?.(i + 1, total);
        let coords = cache.get(address);
        if (!coords) {
          try {
            coords = await geocodeAddress(address);
            if (coords) cache.set(address, coords);
          } catch {
            // skip failed
          }
          if (!cancelled && i < uniqueAddresses.length - 1) {
            await new Promise(r => setTimeout(r, NOMINATIM_DELAY_MS));
          }
        }
        if (coords) {
          group.forEach((order, j) => {
            const offset = group.length > 1
              ? { lat: (j - (group.length - 1) / 2) * 0.003, lng: 0 }
              : { lat: 0, lng: 0 };
            results.push({
              order,
              lat: coords!.lat + offset.lat,
              lng: coords!.lng + offset.lng
            });
          });
        }
      }
      if (!cancelled) setPoints(results);
      setGeocoding(false);
      setGeocodeProgress(null);
    })();

    return () => { cancelled = true; };
  }, [uniqueAddresses, onGeocodeProgress]);

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

  const ordersWithAddress = useMemo(
    () => ordersToShow.filter(o => buildAddressString(o).trim().length > 0),
    [ordersToShow]
  );

  if (!geocoding && orders.length > 0 && ordersWithAddress.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white p-8 text-center text-gray-500">
        No orders have contact address information to display on the map. Add address, city, and state to contacts.
      </div>
    );
  }

  if (!geocoding && orders.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white p-8 text-center text-gray-500">
        No orders to display on the map. Adjust filters or add orders.
      </div>
    );
  }

  // Geocoding finished but no locations found (all failed or no addresses)
  if (!geocoding && ordersWithAddress.length > 0 && points.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white p-8 text-center">
        <p className="text-gray-700 font-medium">No locations could be shown on the map.</p>
        <p className="text-gray-500 text-sm mt-2">
          Geocoding could not find coordinates for the contact addresses. Make sure contacts have address, city, and state filled in.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      {geocoding && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-sm text-amber-800 flex items-center gap-2">
          <span className="animate-pulse">Geocoding addresses…</span>
          {geocodeProgress && (
            <span className="font-medium">{geocodeProgress.current}/{geocodeProgress.total}</span>
          )}
        </div>
      )}
      {orders.length > MAP_ORDER_LIMIT && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-800">
          Showing first {MAP_ORDER_LIMIT} orders on the map. Use filters to narrow results.
        </div>
      )}
      <div className="h-[500px] w-full relative z-0">
        <MapContainer
          key={points.length > 0 ? 'with-points' : 'no-points'}
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
