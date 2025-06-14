import { NextRequest, NextResponse } from 'next/server';
import { WarehouseModel } from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const warehouses = await WarehouseModel.getAll();
    return NextResponse.json({ warehouses });
  } catch (_error) {
    console.error('Error fetching warehouses:', _error);
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
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ 
        _error: 'Warehouse name is required' }, { status: 400 });
    }

    const warehouseId = await WarehouseModel.create({
      name: data.name.trim(),
      address: data.address?.trim() || undefined,
      city: data.city?.trim() || undefined,
      state: data.state?.trim() || undefined,
      zip: data.zip?.trim() || undefined
    });

    const newWarehouse = await WarehouseModel.getById(warehouseId);
    return NextResponse.json({ warehouse: newWarehouse }, { status: 201 });
  } catch (_error) {
    console.error('Error creating warehouse:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
