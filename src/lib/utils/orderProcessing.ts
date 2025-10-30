import { ProductModel, ProductBundleItemModel, InventoryModel } from '@/lib/models';

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  warehouse_id?: string; // per-item warehouse selection
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
              price: Number(bundleItem.component_product_price) || 0,
              is_bundle_component: true,
              parent_bundle_id: item.product_id,
              parent_bundle_name: product.name,
              warehouse_id: item.warehouse_id
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
  processedItems: ProcessedOrderItem[]
): Promise<void> {
  // Group by product AND warehouse (per-line warehouse selection)
  const updates = new Map<string, { productId: string; warehouseId?: string; qty: number }>();

  for (const item of processedItems) {
    const key = `${item.product_id}::${item.warehouse_id || ''}`;
    const prev = updates.get(key) || { productId: item.product_id, warehouseId: item.warehouse_id, qty: 0 };
    prev.qty += item.quantity;
    updates.set(key, prev);
  }

  // Apply updates
  for (const { productId, warehouseId, qty } of updates.values()) {
    if (warehouseId) {
      const inventory = await InventoryModel.getByProductAndWarehouse(productId, warehouseId);
      if (inventory) {
        await InventoryModel.adjustQuantity(inventory.id, -qty, 'Order fulfillment');
      }
    } else {
      // Fallback across warehouses when no warehouse specified
      const inventories = await InventoryModel.getByProductId(productId);
      let remaining = qty;
      for (const inv of inventories) {
        if (remaining <= 0) break;
        const deduct = Math.min(inv.quantity, remaining);
        if (deduct > 0) {
          await InventoryModel.adjustQuantity(inv.id, -deduct, 'Order fulfillment');
          remaining -= deduct;
        }
      }
    }
  }
}

/**
 * Validate that sufficient inventory exists for the order
 */
export async function validateInventoryForOrder(
  processedItems: ProcessedOrderItem[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Group required quantity by product + warehouse (per-line warehouse)
  const required = new Map<string, { productId: string; warehouseId?: string; qty: number }>();
  for (const item of processedItems) {
    const key = `${item.product_id}::${item.warehouse_id || ''}`;
    const prev = required.get(key) || { productId: item.product_id, warehouseId: item.warehouse_id, qty: 0 };
    prev.qty += item.quantity;
    required.set(key, prev);
  }

  for (const { productId, warehouseId, qty } of required.values()) {
    let availableQuantity = 0;

    if (warehouseId) {
      const inventory = await InventoryModel.getByProductAndWarehouse(productId, warehouseId);
      availableQuantity = inventory?.quantity || 0;
    } else {
      const inventories = await InventoryModel.getByProductId(productId);
      availableQuantity = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
    }

    if (availableQuantity < qty) {
      const product = await ProductModel.getById(productId);
      const productName = product?.name || productId;
      errors.push(
        warehouseId
          ? `Insufficient inventory for ${productName} in warehouse ${warehouseId}. Required: ${qty}, Available: ${availableQuantity}`
          : `Insufficient total inventory for ${productName}. Required: ${qty}, Available: ${availableQuantity}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Restore (re-increment) inventory for processed order items, typically when an
 * order moves from Complete back to a non-Complete status.
 */
export async function restoreInventoryForOrder(
  processedItems: ProcessedOrderItem[]
): Promise<void> {
  // Group by product + warehouse
  const updates = new Map<string, { productId: string; warehouseId?: string; qty: number }>();
  for (const item of processedItems) {
    const key = `${item.product_id}::${item.warehouse_id || ''}`;
    const prev = updates.get(key) || { productId: item.product_id, warehouseId: item.warehouse_id, qty: 0 };
    prev.qty += item.quantity;
    updates.set(key, prev);
  }

  for (const { productId, warehouseId, qty } of updates.values()) {
    if (warehouseId) {
      const inv = await InventoryModel.getByProductAndWarehouse(productId, warehouseId);
      if (inv) {
        await InventoryModel.adjustQuantity(inv.id, qty, 'Order status rollback');
      }
    } else {
      const invs = await InventoryModel.getByProductId(productId);
      let remaining = qty;
      for (const inv of invs) {
        if (remaining <= 0) break;
        const add = remaining; // add all remaining into this record
        await InventoryModel.adjustQuantity(inv.id, add, 'Order status rollback');
        remaining -= add;
      }
    }
  }
}

