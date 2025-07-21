import { ShippingMethod, Warehouse } from '@/lib/types';
import { WarehouseModel } from '@/lib/models';

export interface ShippingCalculationRequest {
  productId: string;
  quantity: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  warehouseId?: string;
}

export interface ShippingCalculationResult {
  method: ShippingMethod;
  cost: number;
  estimatedDays?: number;
  error?: string;
  warehouses?: Warehouse[]; // For local pickup methods
}

export interface ShippingQuote {
  methods: ShippingCalculationResult[];
  defaultMethod?: ShippingCalculationResult;
  totalCost: number;
}

// Default shipping method configurations
export const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  {
    type: 'free',
    name: 'Free Shipping',
    description: 'Free standard shipping (5-7 business days)'
  },
  {
    type: 'fixed',
    name: 'Standard Shipping',
    description: 'Standard shipping (3-5 business days)',
    cost: 9.99
  },
  {
    type: 'fixed',
    name: 'Express Shipping',
    description: 'Express shipping (1-2 business days)',
    cost: 29.99
  },
  {
    type: 'fixed',
    name: 'Overnight Shipping',
    description: 'Overnight shipping (next business day)',
    cost: 49.99
  }
];

/**
 * Calculate distance between two coordinates using Haversine formula
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
 * Get coordinates for an address using a geocoding service
 */
export async function getCoordinates(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // This is a placeholder - in production you'd use a real geocoding service
    // like Google Maps Geocoding API, MapBox, or similar
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${process.env.OPENCAGE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.lat,
        lon: result.geometry.lng
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
}

/**
 * Calculate shipping cost based on distance
 */
export function calculateDistanceBasedShipping(
  distanceMiles: number,
  baseRate = 5.00,
  perMileRate = 0.50
): number {
  return Math.max(baseRate, baseRate + (distanceMiles * perMileRate));
}

/**
 * Calculate shipping for a specific method
 */
export async function calculateShippingForMethod(
  method: ShippingMethod,
  request: ShippingCalculationRequest,
  warehouse?: Warehouse
): Promise<ShippingCalculationResult> {
  const result: ShippingCalculationResult = {
    method,
    cost: 0
  };

  try {
    switch (method.type) {
      case 'free':
        result.cost = 0;
        result.estimatedDays = 7;
        break;

      case 'fixed':
        result.cost = (method.cost || 0) * request.quantity;
        result.estimatedDays = method.cost === 49.99 ? 1 : method.cost === 29.99 ? 2 : 5;
        break;

      case 'calculated_distance':
        if (!warehouse || !method.warehouse_id) {
          result.error = 'Warehouse information required for distance calculation';
          break;
        }

        const warehouseAddress = `${warehouse.address}, ${warehouse.city}, ${warehouse.state} ${warehouse.zip}`;
        const customerAddress = `${request.shippingAddress.address}, ${request.shippingAddress.city}, ${request.shippingAddress.state} ${request.shippingAddress.zip}`;

        const warehouseCoords = await getCoordinates(warehouseAddress);
        const customerCoords = await getCoordinates(customerAddress);

        if (!warehouseCoords || !customerCoords) {
          result.error = 'Unable to calculate distance - geocoding failed';
          break;
        }

        const distance = calculateDistance(
          warehouseCoords.lat,
          warehouseCoords.lon,
          customerCoords.lat,
          customerCoords.lon
        );

        result.cost = calculateDistanceBasedShipping(distance) * request.quantity;
        result.estimatedDays = distance < 100 ? 2 : distance < 500 ? 4 : 7;
        break;

      case 'api_calculated':
        // Placeholder for third-party shipping API integration
        result.cost = await calculateApiBasedShipping(method, request);
        result.estimatedDays = 5;
        break;

      case 'local_pickup':
        result.cost = 0; // Local pickup is always free
        result.estimatedDays = 0; // Available immediately

        // Load warehouse information if warehouse_ids are specified
        if (method.warehouse_ids && method.warehouse_ids.length > 0) {
          const warehouses = await Promise.all(
            method.warehouse_ids.map(async (warehouseId) => {
              try {
                return await WarehouseModel.getById(warehouseId);
              } catch (error) {
                console.error(`Error loading warehouse ${warehouseId}:`, error);
                return null;
              }
            })
          );
          result.warehouses = warehouses.filter(Boolean) as Warehouse[];
        }
        break;

      default:
        result.error = 'Unknown shipping method type';
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Shipping calculation failed';
  }

  return result;
}

/**
 * Calculate shipping using third-party APIs (placeholder)
 */
async function calculateApiBasedShipping(
  method: ShippingMethod,
  request: ShippingCalculationRequest
): Promise<number> {
  // This is a placeholder for third-party shipping API integration
  // You would integrate with services like:
  // - UPS API
  // - FedEx API
  // - USPS API
  // - ShipStation API
  // - EasyPost API
  
  if (!method.api_config) {
    throw new Error('API configuration required for API-based shipping');
  }

  const { provider, settings } = method.api_config;

  switch (provider) {
    case 'ups':
      // UPS API integration would go here
      return 15.99;
    
    case 'fedex':
      // FedEx API integration would go here
      return 18.99;
    
    case 'usps':
      // USPS API integration would go here
      return 12.99;
    
    default:
      throw new Error(`Unsupported shipping provider: ${provider}`);
  }
}

/**
 * Get all available shipping methods for a product
 */
export async function getShippingQuote(
  productShippingMethods: ShippingMethod[],
  request: ShippingCalculationRequest,
  warehouse?: Warehouse
): Promise<ShippingQuote> {
  const methods: ShippingCalculationResult[] = [];
  
  // Use product-specific shipping methods or fall back to defaults
  const shippingMethods = productShippingMethods.length > 0 
    ? productShippingMethods 
    : DEFAULT_SHIPPING_METHODS;

  for (const method of shippingMethods) {
    const result = await calculateShippingForMethod(method, request, warehouse);
    if (!result.error) {
      methods.push(result);
    }
  }

  // Sort by cost (ascending)
  methods.sort((a, b) => a.cost - b.cost);

  const defaultMethod = methods.find(m => m.cost === 0) || methods[0];
  const totalCost = defaultMethod?.cost || 0;

  return {
    methods,
    defaultMethod,
    totalCost
  };
}

/**
 * Validate shipping method configuration
 */
export function validateShippingMethod(method: ShippingMethod): string[] {
  const errors: string[] = [];

  if (!method.name?.trim()) {
    errors.push('Shipping method name is required');
  }

  switch (method.type) {
    case 'fixed':
      if (method.cost === undefined || method.cost < 0) {
        errors.push('Fixed shipping methods require a valid cost amount');
      }
      break;

    case 'calculated_distance':
      if (!method.warehouse_id) {
        errors.push('Distance-based shipping requires a warehouse selection');
      }
      break;

    case 'api_calculated':
      if (!method.api_config?.provider) {
        errors.push('API-based shipping requires a provider configuration');
      }
      break;

    case 'local_pickup':
      // Support both legacy pickup_location and new warehouse_ids
      if (!method.pickup_location?.trim() && (!method.warehouse_ids || method.warehouse_ids.length === 0)) {
        errors.push('Local pickup requires either a pickup location or warehouse selection');
      }
      break;
  }

  return errors;
}
