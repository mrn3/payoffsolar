import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, CostCategoryModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortField = searchParams.get('sortField') || 'order_date';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Verify the category exists
    const category = await CostCategoryModel.getById(categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Cost category not found' }, { status: 404 });
    }

    const offset = (page - 1) * limit;

    // Get orders that use this cost category
    const orders = await OrderModel.getOrdersByCostCategory(
      categoryId,
      limit,
      offset,
      sortField,
      sortDirection
    );

    // Get total count for pagination
    const total = await OrderModel.getOrdersByCostCategoryCount(categoryId);

    return NextResponse.json({
      orders,
      category,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders by cost category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
