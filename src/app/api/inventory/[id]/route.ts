import { NextRequest, NextResponse } from 'next/server';
import { InventoryModel } from '@/lib/models';
import {requireAuth, isAdmin} from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;
    const inventory = await InventoryModel.getById(_id);
    if (!inventory) {
      return NextResponse.json({ _error: 'Inventory item not found' }, { status: 404 });
    }

    return NextResponse.json({ inventory });
  } catch (_error) {
    console.error('Error fetching inventory item:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;
    
    // Check if inventory item exists
    const existingInventory = await InventoryModel.getById(_id);
    if (!existingInventory) {
      return NextResponse.json({ _error: 'Inventory item not found' }, { status: 404 });
    }

    // Validate quantities if provided
    if (_data.quantity !== undefined) {
      if (isNaN(_data.quantity) || data.quantity < 0) {
        return NextResponse.json({ 
          _error: 'Quantity must be a valid non-negative number' }, { status: 400 });
      }
    }

    if (_data.min_quantity !== undefined) {
      if (isNaN(_data.min_quantity) || data.min_quantity < 0) {
        return NextResponse.json({ 
          _error: 'Minimum quantity must be a valid non-negative number' }, { status: 400 });
      }
    }

    await InventoryModel.update(_id, {
      quantity: data.quantity !== undefined ? parseInt(_data.quantity) : undefined,
      min_quantity: data.min_quantity !== undefined ? parseInt(_data.min_quantity) : undefined
    });

    const updatedInventory = await InventoryModel.getById(_id);
    return NextResponse.json({ inventory: updatedInventory });
  } catch (_error) {
    console.error('Error updating inventory item:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;
    
    // Check if inventory item exists
    const existingInventory = await InventoryModel.getById(_id);
    if (!existingInventory) {
      return NextResponse.json({ _error: 'Inventory item not found' }, { status: 404 });
    }

    await InventoryModel.delete(_id);
    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (_error) {
    console.error('Error deleting inventory item:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
