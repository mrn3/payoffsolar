import { NextRequest, NextResponse } from 'next/server';
import { CostItemModel, CostCategoryModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

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

    // Validate category if provided
    if (data.category_id) {
      const category = await CostCategoryModel.getById(data.category_id);
      if (!category) {
        return NextResponse.json({ error: 'Cost category not found' }, { status: 404 });
      }
    }

    // Validate amount if provided
    if (data.amount !== undefined && (data.amount === null || isNaN(parseFloat(data.amount)))) {
      return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 });
    }

    // Update cost item
    await CostItemModel.update(id, {
      category_id: data.category_id,
      amount: data.amount !== undefined ? parseFloat(data.amount) : undefined
    });

    return NextResponse.json({ message: 'Cost item updated successfully' });
  } catch (error) {
    console.error('Error updating cost item:', error);
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

    await CostItemModel.delete(id);
    return NextResponse.json({ message: 'Cost item deleted successfully' });
  } catch (error) {
    console.error('Error deleting cost item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
