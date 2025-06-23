import { NextRequest, NextResponse } from 'next/server';
import { CostItemModel, CostCategoryModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.order_id || typeof data.order_id !== 'string') {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!data.category_id || typeof data.category_id !== 'string') {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    if (data.amount === undefined || data.amount === null || isNaN(parseFloat(data.amount))) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // Validate category exists
    const category = await CostCategoryModel.getById(data.category_id);
    if (!category) {
      return NextResponse.json({ error: 'Cost category not found' }, { status: 404 });
    }

    // Create cost item
    const costItemId = await CostItemModel.create({
      order_id: data.order_id,
      category_id: data.category_id,
      amount: parseFloat(data.amount)
    });

    const costItems = await CostItemModel.getByOrderId(data.order_id);
    return NextResponse.json({ costItems }, { status: 201 });
  } catch (error) {
    console.error('Error creating cost item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
