import { NextRequest, NextResponse } from 'next/server';
import { InventoryModel, ProductModel, WarehouseModel } from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _searchParams } = new URL(_request.url);
    const page = parseInt(_searchParams.get('page') || '1');
    const limit = parseInt(_searchParams.get('limit') || '50');
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const search = searchParams.get('search') || undefined;
    const offset = (page - 1) * limit;

    const inventory = await InventoryModel.getAll(limit, offset, warehouseId, search);
    const total = await InventoryModel.getCount(warehouseId, search);

    return NextResponse.json({ 
      inventory, 
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (_error) {
    console.error('Error fetching inventory:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    
    // Validate required fields
    if (!data.product_id || !data.warehouse_id || data.quantity === undefined || data.min_quantity === undefined) {
      return NextResponse.json({ 
        _error: 'Product ID, warehouse ID, quantity, and minimum quantity are required' }, { status: 400 });
    }

    // Validate quantities are non-negative numbers
    if (isNaN(_data.quantity) || data.quantity < 0) {
      return NextResponse.json({ 
        _error: 'Quantity must be a valid non-negative number' }, { status: 400 });
    }

    if (isNaN(_data.min_quantity) || data.min_quantity < 0) {
      return NextResponse.json({ 
        _error: 'Minimum quantity must be a valid non-negative number' }, { status: 400 });
    }

    // Check if product exists
    const product = await ProductModel.getById(_data.product_id);
    if (!product) {
      return NextResponse.json({ _error: 'Product not found' }, { status: 404 });
    }

    // Check if warehouse exists
    const warehouse = await WarehouseModel.getById(_data.warehouse_id);
    if (!warehouse) {
      return NextResponse.json({ _error: 'Warehouse not found' }, { status: 404 });
    }

    // Check if inventory already exists for this product-warehouse combination
    const existingInventory = await InventoryModel.getByProductAndWarehouse(_data.product_id, _data.warehouse_id);
    if (existingInventory) {
      return NextResponse.json({ 
        _error: 'Inventory already exists for this product in this warehouse' }, { status: 409 });
    }

    const inventoryId = await InventoryModel.create({
      product_id: data.product_id,
      warehouse_id: data.warehouse_id,
      quantity: parseInt(_data.quantity),
      min_quantity: parseInt(_data.min_quantity)
    });

    const newInventory = await InventoryModel.getById(inventoryId);
    return NextResponse.json({ inventory: newInventory }, { status: 201 });
  } catch (_error) {
    console.error('Error creating inventory:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
