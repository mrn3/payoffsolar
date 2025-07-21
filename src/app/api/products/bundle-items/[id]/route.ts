import { NextRequest, NextResponse } from 'next/server';
import { ProductBundleItemModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate quantity if provided
    if (data.quantity !== undefined) {
      if (isNaN(data.quantity) || data.quantity <= 0) {
        return NextResponse.json({
          error: 'Quantity must be a positive number'
        }, { status: 400 });
      }
    }

    await ProductBundleItemModel.update(params.id, {
      quantity: data.quantity !== undefined ? parseInt(data.quantity) : undefined,
      sort_order: data.sort_order !== undefined ? parseInt(data.sort_order) : undefined
    });

    return NextResponse.json({ message: 'Bundle item updated successfully' });
  } catch (error) {
    console.error('Error updating bundle item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ProductBundleItemModel.delete(params.id);
    return NextResponse.json({ message: 'Bundle item deleted successfully' });
  } catch (error) {
    console.error('Error deleting bundle item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
