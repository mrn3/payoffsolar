import { NextRequest, NextResponse } from 'next/server';
import { CostCategoryModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

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
    const category = await CostCategoryModel.getById(id);

    if (!category) {
      return NextResponse.json({ error: 'Cost category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching cost category:', error);
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

    // Check if category exists
    const existingCategory = await CostCategoryModel.getById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: 'Cost category not found' }, { status: 404 });
    }

    // Validate name if provided
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
    }

    // Update category
    await CostCategoryModel.update(id, {
      name: data.name?.trim(),
      description: data.description?.trim(),
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined
    });

    const updatedCategory = await CostCategoryModel.getById(id);
    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error('Error updating cost category:', error);
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

    // Check if category exists
    const existingCategory = await CostCategoryModel.getById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: 'Cost category not found' }, { status: 404 });
    }

    await CostCategoryModel.delete(id);
    return NextResponse.json({ message: 'Cost category deleted successfully' });
  } catch (error) {
    console.error('Error deleting cost category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
