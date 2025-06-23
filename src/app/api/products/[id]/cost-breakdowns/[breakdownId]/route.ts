import { NextRequest, NextResponse } from 'next/server';
import { ProductCostBreakdownModel, CostCategoryModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; breakdownId: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, breakdownId } = await params;
    const data = await request.json();

    // Validate category if provided
    if (data.category_id) {
      const category = await CostCategoryModel.getById(data.category_id);
      if (!category) {
        return NextResponse.json({ error: 'Cost category not found' }, { status: 404 });
      }
    }

    // Validate calculation type if provided
    if (data.calculation_type && !['percentage', 'fixed_amount'].includes(data.calculation_type)) {
      return NextResponse.json({ error: 'Calculation type must be "percentage" or "fixed_amount"' }, { status: 400 });
    }

    // Validate value if provided
    if (data.value !== undefined) {
      if (data.value === null || isNaN(parseFloat(data.value))) {
        return NextResponse.json({ error: 'Value must be a valid number' }, { status: 400 });
      }

      const value = parseFloat(data.value);
      if (value < 0) {
        return NextResponse.json({ error: 'Value must be non-negative' }, { status: 400 });
      }

      if (data.calculation_type === 'percentage' && value > 100) {
        return NextResponse.json({ error: 'Percentage value cannot exceed 100%' }, { status: 400 });
      }
    }

    // Update cost breakdown
    await ProductCostBreakdownModel.update(breakdownId, {
      category_id: data.category_id,
      calculation_type: data.calculation_type,
      value: data.value !== undefined ? parseFloat(data.value) : undefined
    });

    const costBreakdowns = await ProductCostBreakdownModel.getByProductId(id);
    return NextResponse.json({ costBreakdowns });
  } catch (error) {
    console.error('Error updating product cost breakdown:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; breakdownId: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, breakdownId } = await params;

    await ProductCostBreakdownModel.delete(breakdownId);
    
    const costBreakdowns = await ProductCostBreakdownModel.getByProductId(id);
    return NextResponse.json({ costBreakdowns });
  } catch (error) {
    console.error('Error deleting product cost breakdown:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
