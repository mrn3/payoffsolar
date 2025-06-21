import { NextRequest, NextResponse } from 'next/server';
import { ProductCategoryModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const category = await ProductCategoryModel.getById(id);

    if (!category) {
      return NextResponse.json({ error: 'Product category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching product category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const data = await request.json();

    // Check if category exists
    const existingCategory = await ProductCategoryModel.getById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: 'Product category not found' }, { status: 404 });
    }

    // Validate required fields
    if (data.name !== undefined && (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check for duplicate slug if provided and different from current
    if (data.slug && data.slug !== existingCategory.slug) {
      const categoryWithSlug = await ProductCategoryModel.getBySlug(data.slug);
      if (categoryWithSlug && categoryWithSlug.id !== id) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    // Update category
    await ProductCategoryModel.update(id, {
      name: data.name?.trim(),
      description: data.description?.trim(),
      slug: data.slug?.trim(),
      parent_id: data.parent_id?.trim() || null
    });

    const updatedCategory = await ProductCategoryModel.getById(id);
    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error('Error updating product category:', error);
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Category name or slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;

    // Check if category exists
    const existingCategory = await ProductCategoryModel.getById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: 'Product category not found' }, { status: 404 });
    }

    // Delete category (this will check for dependencies)
    await ProductCategoryModel.delete(id);

    return NextResponse.json({ message: 'Product category deleted successfully' });
  } catch (error) {
    console.error('Error deleting product category:', error);
    if (error instanceof Error && error.message.includes('Cannot delete category')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
