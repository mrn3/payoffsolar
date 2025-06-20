import { NextRequest, NextResponse } from 'next/server';
import { ProductCostBreakdownModel, CostCategoryModel, ProductModel } from '@/lib/models';
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
    
    // Verify product exists
    const product = await ProductModel.getById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const costBreakdowns = await ProductCostBreakdownModel.getByProductId(id);
    return NextResponse.json({ costBreakdowns });
  } catch (error) {
    console.error('Error fetching product cost breakdowns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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

    // Verify product exists
    const product = await ProductModel.getById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate required fields
    if (!data.category_id || typeof data.category_id !== 'string') {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    if (!data.calculation_type || !['percentage', 'fixed_amount'].includes(data.calculation_type)) {
      return NextResponse.json({ error: 'Calculation type must be "percentage" or "fixed_amount"' }, { status: 400 });
    }

    if (data.value === undefined || data.value === null || isNaN(parseFloat(data.value))) {
      return NextResponse.json({ error: 'Valid value is required' }, { status: 400 });
    }

    const value = parseFloat(data.value);
    if (value < 0) {
      return NextResponse.json({ error: 'Value must be non-negative' }, { status: 400 });
    }

    if (data.calculation_type === 'percentage' && value > 100) {
      return NextResponse.json({ error: 'Percentage value cannot exceed 100%' }, { status: 400 });
    }

    // Validate category exists
    const category = await CostCategoryModel.getById(data.category_id);
    if (!category) {
      return NextResponse.json({ error: 'Cost category not found' }, { status: 404 });
    }

    // Create cost breakdown
    const costBreakdownId = await ProductCostBreakdownModel.create({
      product_id: id,
      category_id: data.category_id,
      calculation_type: data.calculation_type,
      value: value,
      description: data.description ? data.description.trim() : undefined
    });

    const costBreakdowns = await ProductCostBreakdownModel.getByProductId(id);
    return NextResponse.json({ costBreakdowns }, { status: 201 });
  } catch (error) {
    console.error('Error creating product cost breakdown:', error);
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'A cost breakdown for this category already exists for this product' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
