import { NextRequest, NextResponse } from 'next/server';
import { ProductModel, ProductBundleItemModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;

    const bundleProduct = await ProductModel.getById(params.id);
    if (!bundleProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!bundleProduct.is_bundle) {
      return NextResponse.json({ error: 'Product is not a bundle' }, { status: 400 });
    }

    // Calculate bundle inventory
    const bundleInventory = await ProductBundleItemModel.calculateBundleInventory(params.id, warehouseId);
    
    // Get detailed component inventory
    const bundleItems = await ProductBundleItemModel.getByBundleId(params.id);
    const componentInventory = [];

    for (const item of bundleItems) {
      // Get inventory for this component
      const inventoryQuery = warehouseId 
        ? `SELECT i.*, w.name as warehouse_name 
           FROM inventory i
           LEFT JOIN warehouses w ON i.warehouse_id = w.id
           WHERE i.product_id = ? AND i.warehouse_id = ?`
        : `SELECT i.*, w.name as warehouse_name 
           FROM inventory i
           LEFT JOIN warehouses w ON i.warehouse_id = w.id
           WHERE i.product_id = ?`;
      
      const params_query = warehouseId 
        ? [item.component_product_id, warehouseId]
        : [item.component_product_id];

      // For simplicity, let's get total quantity per component
      const totalQuery = warehouseId 
        ? `SELECT COALESCE(SUM(quantity), 0) as total_quantity 
           FROM inventory 
           WHERE product_id = ? AND warehouse_id = ?`
        : `SELECT COALESCE(SUM(quantity), 0) as total_quantity 
           FROM inventory 
           WHERE product_id = ?`;

      const { executeQuery, getOne } = await import('@/lib/mysql/connection');
      const totalResult = await getOne<{ total_quantity: number }>(totalQuery, params_query);
      const totalQuantity = totalResult?.total_quantity || 0;
      
      const bundlesFromThisComponent = Math.floor(totalQuantity / item.quantity);

      componentInventory.push({
        componentId: item.component_product_id,
        componentName: item.component_product_name,
        componentSku: item.component_product_sku,
        requiredQuantity: item.quantity,
        availableQuantity: totalQuantity,
        bundlesAvailable: bundlesFromThisComponent,
        isLimiting: bundlesFromThisComponent === bundleInventory.availableQuantity
      });
    }

    return NextResponse.json({
      bundleId: params.id,
      bundleName: bundleProduct.name,
      bundleSku: bundleProduct.sku,
      warehouseId,
      availableQuantity: bundleInventory.availableQuantity,
      limitingComponent: bundleInventory.limitingComponent,
      componentInventory
    });
  } catch (error) {
    console.error('Error calculating bundle inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
