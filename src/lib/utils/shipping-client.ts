import { ShippingMethod } from '@/lib/types';

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
    cost: 9.99,
    description: 'Standard shipping (3-5 business days)'
  },
  {
    type: 'fixed',
    name: 'Express Shipping',
    cost: 29.99,
    description: 'Express shipping (1-2 business days)'
  },
  {
    type: 'fixed',
    name: 'Overnight Shipping',
    cost: 49.99,
    description: 'Overnight shipping (next business day)'
  }
];

// Default freight rates (mirrors server-side DEFAULT_FREIGHT_RATES)
export const DEFAULT_FREIGHT_RATES = {
  base_cost: 100,
  per_unit_cost: 25,
  per_mile_cost: 0.5
};

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

    case 'freight':
      if ([method.base_cost, method.per_unit_cost, method.per_mile_cost].some(v => v !== undefined && v < 0)) {
        errors.push('Freight rates cannot be negative');
      }
      break;

    case 'api_calculated':
      if (!method.api_config?.provider) {
        errors.push('API-based shipping requires a provider configuration');
      }
      break;

    case 'local_pickup':
      if (!method.pickup_location?.trim() && (!method.warehouse_ids || method.warehouse_ids.length === 0)) {
        errors.push('Local pickup requires either a pickup location or warehouse selection');
      }
      break;
  }

  return errors;
}
