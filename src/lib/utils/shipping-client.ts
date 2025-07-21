import { ShippingMethod } from '@/lib/types';

// Default shipping method configurations
export const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  {
    type: 'free',
    description: 'Free standard shipping (5-7 business days)'
  },
  {
    type: 'fixed',
    amount: 9.99,
    description: 'Standard shipping (3-5 business days)'
  },
  {
    type: 'fixed',
    amount: 29.99,
    description: 'Express shipping (1-2 business days)'
  },
  {
    type: 'fixed',
    amount: 49.99,
    description: 'Overnight shipping (next business day)'
  }
];

/**
 * Validate shipping method configuration
 */
export function validateShippingMethod(method: ShippingMethod): string[] {
  const errors: string[] = [];

  if (!method.description?.trim()) {
    errors.push('Shipping method description is required');
  }

  switch (method.type) {
    case 'fixed':
      if (method.amount === undefined || method.amount < 0) {
        errors.push('Fixed shipping methods require a valid amount');
      }
      break;

    case 'calculated':
      // No specific validation needed for calculated shipping
      break;

    case 'pickup':
      if (!method.warehouses || method.warehouses.length === 0) {
        errors.push('Local pickup requires warehouse selection');
      }
      break;
  }

  return errors;
}
