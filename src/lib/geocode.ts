/**
 * Server-side geocoding using OpenStreetMap Nominatim.
 * Use for contact address -> lat/lng. Respects 1 request/second policy.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'PayoffSolar/1.0 (contact-address-geocoding)';

export interface GeocodeResult {
  lat: number;
  lng: number;
}

/**
 * Build a single query string from address parts for Nominatim.
 */
export function buildAddressQuery(parts: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string {
  const { address, city, state, zip } = parts;
  const segments = [address, city, state, zip].filter(Boolean).map((s) => String(s).trim());
  return segments.join(', ') || '';
}

/**
 * Geocode an address string. Returns { lat, lng } or null if not found.
 * Call from server only (Node). Nominatim allows 1 req/sec - caller should throttle if batching.
 */
export async function geocodeAddress(addressQuery: string): Promise<GeocodeResult | null> {
  const trimmed = addressQuery?.trim();
  if (!trimmed) return null;

  const url = `${NOMINATIM_BASE}?${new URLSearchParams({
    q: trimmed,
    format: 'json',
    limit: '1',
  })}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const lat = parseFloat((data[0] as { lat?: string }).lat);
  const lng = parseFloat((data[0] as { lon?: string }).lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

/**
 * Geocode contact address fields and return lat/lng. Returns null if insufficient address or geocode fails.
 */
export async function geocodeContactAddress(contact: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): Promise<GeocodeResult | null> {
  const query = buildAddressQuery(contact);
  return geocodeAddress(query);
}
