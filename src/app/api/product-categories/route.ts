import { NextRequest, NextResponse } from 'next/server';
import { ProductCategoryModel } from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeUsage = searchParams.get('includeUsage') === 'true';

    if (includeUsage) {
      const usageStats = await ProductCategoryModel.getUsageStats();
      return NextResponse.json({ categories: usageStats });
    }

    const categories = await ProductCategoryModel.getAll();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching product categories:', error);
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
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check for duplicate slug if provided
    if (data.slug) {
      const existingCategory = await ProductCategoryModel.getBySlug(data.slug);
      if (existingCategory) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    // Create category
    const categoryId = await ProductCategoryModel.create({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      slug: data.slug?.trim() || null,
      parent_id: data.parent_id?.trim() || null
    });

    const newCategory = await ProductCategoryModel.getById(categoryId);
    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating product category:', error);
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Category name or slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
