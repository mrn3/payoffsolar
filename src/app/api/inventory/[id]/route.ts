import { NextRequest, NextResponse } from 'next/server';
import { InventoryModel } from '@/lib/models';
import {requireAuth, isAdmin} from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const inventory = await InventoryModel.getById(id);
    if (!inventory) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    return NextResponse.json({ inventory });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if inventory item exists
    const existingInventory = await InventoryModel.getById(id);
    if (!existingInventory) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    // Validate quantities if provided
    if (data.quantity !== undefined) {
      if (isNaN(data.quantity) || data.quantity < 0) {
        return NextResponse.json({
          error: 'Quantity must be a valid non-negative number' }, { status: 400 });
      }
    }

    if (data.min_quantity !== undefined) {
      if (isNaN(data.min_quantity) || data.min_quantity < 0) {
        return NextResponse.json({
          error: 'Minimum quantity must be a valid non-negative number' }, { status: 400 });
      }
    }

    await InventoryModel.update(id, {
      quantity: data.quantity !== undefined ? parseInt(data.quantity) : undefined,
      min_quantity: data.min_quantity !== undefined ? parseInt(data.min_quantity) : undefined
    });

    const updatedInventory = await InventoryModel.getById(id);
    return NextResponse.json({ inventory: updatedInventory });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Check if inventory item exists
    const existingInventory = await InventoryModel.getById(id);
    if (!existingInventory) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    await InventoryModel.delete(id);
    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
