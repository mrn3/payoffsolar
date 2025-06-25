import { NextRequest, NextResponse } from 'next/server';
import { WarehouseModel } from '@/lib/models';
import {requireAuth, isAdmin} from '@/lib/auth';

export async function GET(
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
    const warehouse = await WarehouseModel.getById(id);
    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json({ warehouse });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
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

    // Check if warehouse exists
    const existingWarehouse = await WarehouseModel.getById(id);
    if (!existingWarehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Validate name if provided
    if (data.name !== undefined && (!data.name || !data.name.trim())) {
      return NextResponse.json({ error: 'Warehouse name cannot be empty' }, { status: 400 });
    }

    await WarehouseModel.update(id, {
      name: data.name?.trim(),
      address: data.address?.trim(),
      city: data.city?.trim(),
      state: data.state?.trim(),
      zip: data.zip?.trim()
    });

    const updatedWarehouse = await WarehouseModel.getById(id);
    return NextResponse.json({ warehouse: updatedWarehouse });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check if warehouse exists
    const existingWarehouse = await WarehouseModel.getById(id);
    if (!existingWarehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    await WarehouseModel.delete(id);
    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
