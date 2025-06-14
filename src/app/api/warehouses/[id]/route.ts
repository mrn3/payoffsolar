import { NextRequest, NextResponse } from 'next/server';
import { WarehouseModel } from '@/lib/models';
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
    const warehouse = await WarehouseModel.getById(_id);
    if (!warehouse) {
      return NextResponse.json({ _error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json({ warehouse });
  } catch (_error) {
    console.error('Error fetching warehouse:', _error);
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
    
    // Check if warehouse exists
    const existingWarehouse = await WarehouseModel.getById(_id);
    if (!existingWarehouse) {
      return NextResponse.json({ _error: 'Warehouse not found' }, { status: 404 });
    }

    // Validate name if provided
    if (_data.name !== undefined && (!data.name || !data.name.trim())) {
      return NextResponse.json({ _error: 'Warehouse name cannot be empty' }, { status: 400 });
    }

    await WarehouseModel.update(_id, {
      name: data.name?.trim(),
      address: data.address?.trim(),
      city: data.city?.trim(),
      state: data.state?.trim(),
      zip: data.zip?.trim()
    });

    const updatedWarehouse = await WarehouseModel.getById(_id);
    return NextResponse.json({ warehouse: updatedWarehouse });
  } catch (_error) {
    console.error('Error updating warehouse:', _error);
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
    
    // Check if warehouse exists
    const existingWarehouse = await WarehouseModel.getById(_id);
    if (!existingWarehouse) {
      return NextResponse.json({ _error: 'Warehouse not found' }, { status: 404 });
    }

    await WarehouseModel.delete(_id);
    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch (_error) {
    console.error('Error deleting warehouse:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
