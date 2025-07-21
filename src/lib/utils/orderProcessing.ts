import { ProductModel, ProductBundleItemModel } from '@/lib/models';

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface ProcessedOrderItem extends OrderItem {
  is_bundle_component?: boolean;
  parent_bundle_id?: string;
  parent_bundle_name?: string;
}

export interface OrderProcessingOptions {
  expandBundles?: boolean; // If true, expand bundles into component items
  preserveBundleStructure?: boolean; // If true, keep bundle as single item but track components
}

/**
 * Process order items, handling bundle products according to the specified options
 */
export async function processOrderItems(
  items: OrderItem[], 
  options: OrderProcessingOptions = { expandBundles: true, preserveBundleStructure: false }
): Promise<ProcessedOrderItem[]> {
  const processedItems: ProcessedOrderItem[] = [];

  for (const item of items) {
    // Check if this product is a bundle
    const product = await ProductModel.getById(item.product_id);
    
    if (!product) {
      throw new Error(`Product with ID ${item.product_id} not found`);
    }

    if (product.is_bundle) {
      if (options.expandBundles) {
        // Expand bundle into component items
        const bundleItems = await ProductBundleItemModel.getByBundleId(item.product_id);
        
        for (const bundleItem of bundleItems) {
          if (bundleItem.component_product_price !== undefined) {
            processedItems.push({
              product_id: bundleItem.component_product_id,
              quantity: bundleItem.quantity * item.quantity,
              price: bundleItem.component_product_price,
              is_bundle_component: true,
              parent_bundle_id: item.product_id,
              parent_bundle_name: product.name
            });
          }
        }
      } else {
        // Keep bundle as single item
        processedItems.push({
          ...item,
          price: product.bundle_pricing_type === 'calculated' 
            ? await calculateBundlePrice(item.product_id, product)
            : product.price
        });
      }
    } else {
      // Regular product, add as-is
      processedItems.push(item);
    }
  }

  return processedItems;
}

/**
 * Calculate the effective price for a bundle product
 */
async function calculateBundlePrice(bundleProductId: string, bundleProduct: any): Promise<number> {
  const bundlePricing = await ProductBundleItemModel.calculateBundlePrice(bundleProductId);
  
  if (bundleProduct.bundle_pricing_type === 'calculated') {
    const discountAmount = (bundlePricing.totalPrice * bundleProduct.bundle_discount_percentage) / 100;
    return bundlePricing.totalPrice - discountAmount;
  } else {
    return bundleProduct.price;
  }
}

/**
 * Update inventory for processed order items
 */
export async function updateInventoryForOrder(
  processedItems: ProcessedOrderItem[], 
  warehouseId?: string
): Promise<void> {
  const { InventoryModel } = await import('@/lib/models');
  
  // Group items by product to handle multiple quantities
  const inventoryUpdates = new Map<string, number>();
  
  for (const item of processedItems) {
    const currentQuantity = inventoryUpdates.get(item.product_id) || 0;
    inventoryUpdates.set(item.product_id, currentQuantity + item.quantity);
  }

  // Apply inventory updates
  for (const [productId, totalQuantity] of inventoryUpdates) {
    if (warehouseId) {
      // Update specific warehouse inventory
      const inventory = await InventoryModel.getByProductAndWarehouse(productId, warehouseId);
      if (inventory) {
        await InventoryModel.adjustQuantity(inventory.id, -totalQuantity, 'Order fulfillment');
      }
    } else {
      // Update inventory across all warehouses (FIFO or other strategy could be implemented)
      const inventories = await InventoryModel.getByProductId(productId);
      let remainingToDeduct = totalQuantity;
      
      for (const inventory of inventories) {
        if (remainingToDeduct <= 0) break;
        
        const deductFromThis = Math.min(inventory.quantity, remainingToDeduct);
        if (deductFromThis > 0) {
          await InventoryModel.adjustQuantity(inventory.id, -deductFromThis, 'Order fulfillment');
          remainingToDeduct -= deductFromThis;
        }
      }
    }
  }
}

/**
 * Validate that sufficient inventory exists for the order
 */
export async function validateInventoryForOrder(
  processedItems: ProcessedOrderItem[], 
  warehouseId?: string
): Promise<{ valid: boolean; errors: string[] }> {
  const { InventoryModel } = await import('@/lib/models');
  const errors: string[] = [];
  
  // Group items by product to handle multiple quantities
  const requiredQuantities = new Map<string, number>();
  
  for (const item of processedItems) {
    const currentQuantity = requiredQuantities.get(item.product_id) || 0;
    requiredQuantities.set(item.product_id, currentQuantity + item.quantity);
  }

  // Check inventory for each product
  for (const [productId, requiredQuantity] of requiredQuantities) {
    let availableQuantity = 0;
    
    if (warehouseId) {
      const inventory = await InventoryModel.getByProductAndWarehouse(productId, warehouseId);
      availableQuantity = inventory?.quantity || 0;
    } else {
      const inventories = await InventoryModel.getByProductId(productId);
      availableQuantity = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
    }
    
    if (availableQuantity < requiredQuantity) {
      const product = await ProductModel.getById(productId);
      const productName = product?.name || productId;
      errors.push(
        `Insufficient inventory for ${productName}. Required: ${requiredQuantity}, Available: ${availableQuantity}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
