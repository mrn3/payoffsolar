import { NextRequest, NextResponse } from 'next/server';
import { InventoryModel, ProductModel, WarehouseModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
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
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.product_id || !data.warehouse_id || data.quantity === undefined || data.min_quantity === undefined) {
      return NextResponse.json({ 
        error: 'Product ID, warehouse ID, quantity, and minimum quantity are required' 
      }, { status: 400 });
    }

    // Validate quantities are non-negative numbers
    if (isNaN(data.quantity) || data.quantity < 0) {
      return NextResponse.json({ 
        error: 'Quantity must be a valid non-negative number' 
      }, { status: 400 });
    }

    if (isNaN(data.min_quantity) || data.min_quantity < 0) {
      return NextResponse.json({ 
        error: 'Minimum quantity must be a valid non-negative number' 
      }, { status: 400 });
    }

    // Check if product exists
    const product = await ProductModel.getById(data.product_id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if warehouse exists
    const warehouse = await WarehouseModel.getById(data.warehouse_id);
    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Check if inventory already exists for this product-warehouse combination
    const existingInventory = await InventoryModel.getByProductAndWarehouse(data.product_id, data.warehouse_id);
    if (existingInventory) {
      return NextResponse.json({ 
        error: 'Inventory already exists for this product in this warehouse' 
      }, { status: 409 });
    }

    const inventoryId = await InventoryModel.create({
      product_id: data.product_id,
      warehouse_id: data.warehouse_id,
      quantity: parseInt(data.quantity),
      min_quantity: parseInt(data.min_quantity)
    });

    const newInventory = await InventoryModel.getById(inventoryId);
    return NextResponse.json({ inventory: newInventory }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
