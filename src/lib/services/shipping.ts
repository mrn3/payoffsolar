import { ProductModel, WarehouseModel, Product, Warehouse } from '@/lib/models';
import { 
  getShippingQuote, 
  ShippingCalculationRequest, 
  ShippingQuote,
  calculateShippingForMethod,
  DEFAULT_SHIPPING_METHODS 
} from '@/lib/utils/shipping';

export class ShippingService {
  /**
   * Calculate shipping costs for a single product
   */
  static async calculateProductShipping(
    productId: string,
    quantity: number,
    shippingAddress: {
      address: string;
      city: string;
      state: string;
      zip: string;
      country?: string;
    }
  ): Promise<ShippingQuote> {
    const product = await ProductModel.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const request: ShippingCalculationRequest = {
      productId,
      quantity,
      shippingAddress: {
        ...shippingAddress,
        country: shippingAddress.country || 'US'
      }
    };

    // Get warehouse if needed for distance-based shipping
    let warehouse: Warehouse | undefined;
    if (product.shipping_methods?.some(method => method.type === 'calculated_distance')) {
      const distanceMethod = product.shipping_methods.find(method => method.type === 'calculated_distance');
      if (distanceMethod?.warehouse_id) {
        const warehouseData = await WarehouseModel.getById(distanceMethod.warehouse_id);
        if (warehouseData) {
          warehouse = warehouseData;
        }
      }
    }

    return getShippingQuote(product.shipping_methods || [], request, warehouse);
  }

  /**
   * Calculate shipping costs for multiple products (cart)
   */
  static async calculateCartShipping(
    items: Array<{
      productId: string;
      quantity: number;
    }>,
    shippingAddress: {
      address: string;
      city: string;
      state: string;
      zip: string;
      country?: string;
    } | null
  ): Promise<{
    totalCost: number;
    methods: Array<{
      name: string;
      cost: number;
      estimatedDays?: number;
    }>;
    breakdown: Array<{
      productId: string;
      productName: string;
      quote: ShippingQuote;
    }>;
  }> {
    const breakdown = [];
    const methodTotals = new Map<string, { cost: number; estimatedDays?: number }>();

    // Calculate shipping for each product
    for (const item of items) {
      let quote: ShippingQuote;

      if (shippingAddress) {
        quote = await this.calculateProductShipping(
          item.productId,
          item.quantity,
          shippingAddress
        );
      } else {
        // No shipping address provided - only return local pickup methods
        const product = await ProductModel.getById(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const shippingMethods = product.shipping_methods || DEFAULT_SHIPPING_METHODS;
        const localPickupMethods = shippingMethods.filter(method => method.type === 'local_pickup');

        if (localPickupMethods.length === 0) {
          // No local pickup available for this product
          quote = {
            methods: [],
            totalCost: 0
          };
        } else {
          // Calculate local pickup methods with warehouse information
          const methods = await Promise.all(localPickupMethods.map(async (method) => {
            let warehouses = [];

            // Get warehouse information for this pickup method
            if (method.warehouse_ids && method.warehouse_ids.length > 0) {
              // Load warehouses for this method
              warehouses = await Promise.all(
                method.warehouse_ids.map(async (warehouseId) => {
                  try {
                    return await WarehouseModel.getById(warehouseId);
                  } catch (error) {
                    console.error(`Error loading warehouse ${warehouseId}:`, error);
                    return null;
                  }
                })
              );
              warehouses = warehouses.filter(Boolean); // Remove null entries
            }

            return {
              method: {
                ...method,
                warehouses // Include warehouse details
              },
              cost: 0,
              estimatedDays: 0
            };
          }));

          quote = {
            methods,
            defaultMethod: methods[0],
            totalCost: 0
          };
        }
      }

      const product = await ProductModel.getById(item.productId);
      breakdown.push({
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        quote
      });

      // Aggregate shipping methods
      for (const method of quote.methods) {
        const key = method.method.name;
        const existing = methodTotals.get(key);

        if (existing) {
          // Special handling for free shipping - if any product has free shipping for this method,
          // the entire cart gets free shipping for this method
          if (method.method.type === 'free' || method.cost === 0) {
            existing.cost = 0;
          } else if (existing.cost > 0) {
            // Only add costs if the existing method isn't already free
            existing.cost += method.cost;
          }

          // Use the longest estimated delivery time
          if (method.estimatedDays && existing.estimatedDays) {
            existing.estimatedDays = Math.max(existing.estimatedDays, method.estimatedDays);
          }
        } else {
          methodTotals.set(key, {
            cost: method.cost,
            estimatedDays: method.estimatedDays
          });
        }
      }
    }

    // Convert aggregated methods to array
    const methods = Array.from(methodTotals.entries()).map(([name, data]) => ({
      name,
      cost: data.cost,
      estimatedDays: data.estimatedDays
    }));

    // Sort by cost
    methods.sort((a, b) => a.cost - b.cost);

    const totalCost = methods.length > 0 ? methods[0].cost : 0;

    return {
      totalCost,
      methods,
      breakdown
    };
  }

  /**
   * Get available shipping methods for a product
   */
  static async getProductShippingMethods(productId: string): Promise<{
    product: Product;
    hasCustomMethods: boolean;
    methods: Array<{
      type: string;
      name: string;
      description?: string;
      requiresCalculation: boolean;
    }>;
  }> {
    const product = await ProductModel.getById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const hasCustomMethods = product.shipping_methods && product.shipping_methods.length > 0;
    const shippingMethods = hasCustomMethods ? product.shipping_methods! : DEFAULT_SHIPPING_METHODS;

    const methods = shippingMethods.map(method => ({
      type: method.type,
      name: method.name,
      description: method.description,
      requiresCalculation: method.type === 'calculated_distance' || method.type === 'api_calculated'
    }));

    return {
      product,
      hasCustomMethods: hasCustomMethods || false,
      methods
    };
  }

  /**
   * Validate shipping address
   */
  static validateShippingAddress(address: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!address.address?.trim()) {
      errors.push('Street address is required');
    }

    if (!address.city?.trim()) {
      errors.push('City is required');
    }

    if (!address.state?.trim()) {
      errors.push('State is required');
    }

    if (!address.zip?.trim()) {
      errors.push('ZIP code is required');
    } else {
      // Basic US ZIP code validation
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(address.zip.trim())) {
        errors.push('Invalid ZIP code format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get shipping cost estimate without full calculation
   */
  static getShippingEstimate(
    productShippingMethods: Array<{ type: string; cost?: number }>,
    quantity: number = 1
  ): { minCost: number; maxCost: number; hasVariableCost: boolean } {
    if (!productShippingMethods.length) {
      // Use default methods
      const costs = DEFAULT_SHIPPING_METHODS
        .filter(method => method.cost !== undefined)
        .map(method => method.cost! * quantity);
      
      return {
        minCost: Math.min(0, ...costs), // Include free shipping
        maxCost: Math.max(...costs),
        hasVariableCost: false
      };
    }

    const fixedCosts = productShippingMethods
      .filter(method => method.type === 'fixed' && method.cost !== undefined)
      .map(method => method.cost! * quantity);

    const hasFreeShipping = productShippingMethods.some(method => method.type === 'free');
    const hasVariableCost = productShippingMethods.some(
      method => method.type === 'calculated_distance' || method.type === 'api_calculated'
    );

    const minFixedCost = fixedCosts.length > 0 ? Math.min(...fixedCosts) : Infinity;
    const maxFixedCost = fixedCosts.length > 0 ? Math.max(...fixedCosts) : 0;

    let minCost = hasFreeShipping ? 0 : minFixedCost;
    let maxCost = maxFixedCost;

    if (hasVariableCost) {
      // Add estimated range for variable costs
      minCost = Math.min(minCost, 5.00 * quantity); // Minimum estimated shipping
      maxCost = Math.max(maxCost, 50.00 * quantity); // Maximum estimated shipping
    }

    return {
      minCost: minCost === Infinity ? 0 : minCost,
      maxCost,
      hasVariableCost
    };
  }
}
