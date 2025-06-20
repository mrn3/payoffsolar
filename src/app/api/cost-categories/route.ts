import { NextRequest, NextResponse } from 'next/server';
import { CostCategoryModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const includeUsage = searchParams.get('includeUsage') === 'true';

    if (includeUsage) {
      const usageStats = await CostCategoryModel.getUsageStats();
      return NextResponse.json({ categories: usageStats });
    }

    const categories = includeInactive
      ? await CostCategoryModel.getAllIncludingInactive()
      : await CostCategoryModel.getAll();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching cost categories:', error);
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

    // Create category
    const categoryId = await CostCategoryModel.create({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true
    });

    const category = await CostCategoryModel.getById(categoryId);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating cost category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
