/**
 * Utility functions for trip planning and route optimization
 */

export interface TripStop {
  orderId: string;
  contactName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  total: number;
  status: string;
}

export interface TripStopWithDistance extends TripStop {
  distanceFromPrevious?: number; // in miles
  googleMapsLink: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Generate a Google Maps link for a single address
 */
export function generateGoogleMapsLink(address: string, city: string, state: string, zip: string): string {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

/**
 * Generate a Google Maps directions link for multiple waypoints
 * First address is origin, last is destination, middle ones are waypoints
 */
export function generateGoogleMapsDirectionsLink(stops: TripStop[]): string {
  if (stops.length === 0) return '';
  if (stops.length === 1) {
    return generateGoogleMapsLink(stops[0].address, stops[0].city, stops[0].state, stops[0].zip);
  }

  const origin = `${stops[0].address}, ${stops[0].city}, ${stops[0].state} ${stops[0].zip}`;
  const destination = `${stops[stops.length - 1].address}, ${stops[stops.length - 1].city}, ${stops[stops.length - 1].state} ${stops[stops.length - 1].zip}`;
  
  const waypoints = stops.slice(1, -1).map(stop => 
    `${stop.address}, ${stop.city}, ${stop.state} ${stop.zip}`
  );

  let url = `https://www.google.com/maps/dir/?api=1`;
  url += `&origin=${encodeURIComponent(origin)}`;
  url += `&destination=${encodeURIComponent(destination)}`;
  
  if (waypoints.length > 0) {
    url += `&waypoints=${encodeURIComponent(waypoints.join('|'))}`;
  }

  return url;
}

/**
 * Calculate distances for a route and add them to each stop
 */
export function calculateRouteDistances(stops: TripStop[]): TripStopWithDistance[] {
  const result: TripStopWithDistance[] = [];

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const stopWithDistance: TripStopWithDistance = {
      ...stop,
      googleMapsLink: generateGoogleMapsLink(stop.address, stop.city, stop.state, stop.zip),
    };

    // Calculate distance from previous stop (if not the first stop and both have coordinates)
    if (i > 0) {
      const prevStop = stops[i - 1];
      if (
        stop.latitude !== null && stop.longitude !== null &&
        prevStop.latitude !== null && prevStop.longitude !== null
      ) {
        stopWithDistance.distanceFromPrevious = calculateDistance(
          prevStop.latitude,
          prevStop.longitude,
          stop.latitude,
          stop.longitude
        );
      }
    }

    result.push(stopWithDistance);
  }

  return result;
}

/**
 * Calculate total distance for entire route
 */
export function calculateTotalDistance(stops: TripStopWithDistance[]): number {
  return stops.reduce((total, stop) => {
    return total + (stop.distanceFromPrevious || 0);
  }, 0);
}

/**
 * Format distance for display (e.g., "12.5 mi")
 */
export function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}

/**
 * Get estimated drive time in minutes (assuming average speed of 45 mph with city traffic)
 */
export function getEstimatedDriveTime(miles: number): number {
  const averageSpeed = 45; // mph
  return Math.round((miles / averageSpeed) * 60);
}

/**
 * Format drive time for display (e.g., "1h 30m" or "45m")
 */
export function formatDriveTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
