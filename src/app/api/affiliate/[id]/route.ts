import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { AffiliateCodeModel } from '@/lib/models';

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
    const affiliateCode = await AffiliateCodeModel.getById(id);
    
    if (!affiliateCode) {
      return NextResponse.json({ error: 'Affiliate code not found' }, { status: 404 });
    }

    return NextResponse.json({ affiliateCode });
  } catch (error) {
    console.error('Error fetching affiliate code:', error);
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

    // Check if affiliate code exists
    const existingCode = await AffiliateCodeModel.getById(id);
    if (!existingCode) {
      return NextResponse.json({ error: 'Affiliate code not found' }, { status: 404 });
    }

    // Validate discount type if provided
    if (data.discount_type && !['percentage', 'fixed_amount'].includes(data.discount_type)) {
      return NextResponse.json({
        error: 'Discount type must be "percentage" or "fixed_amount"'
      }, { status: 400 });
    }

    // Validate discount value if provided
    if (data.discount_value !== undefined) {
      const discountValue = parseFloat(data.discount_value);
      if (isNaN(discountValue) || discountValue <= 0) {
        return NextResponse.json({
          error: 'Discount value must be a positive number'
        }, { status: 400 });
      }

      // Validate percentage range
      if ((data.discount_type || existingCode.discount_type) === 'percentage' && discountValue > 100) {
        return NextResponse.json({
          error: 'Percentage discount cannot exceed 100%'
        }, { status: 400 });
      }
    }

    // Check if code already exists (if changing code)
    if (data.code && data.code.toUpperCase() !== existingCode.code) {
      const codeExists = await AffiliateCodeModel.getByCode(data.code.toUpperCase());
      if (codeExists) {
        return NextResponse.json({
          error: 'Affiliate code already exists'
        }, { status: 400 });
      }
    }

    await AffiliateCodeModel.update(id, {
      code: data.code ? data.code.toUpperCase() : undefined,
      name: data.name,
      discount_type: data.discount_type,
      discount_value: data.discount_value !== undefined ? parseFloat(data.discount_value) : undefined,
      is_active: data.is_active,
      expires_at: data.expires_at,
      usage_limit: data.usage_limit,
      usage_count: data.usage_count
    });

    const updatedAffiliateCode = await AffiliateCodeModel.getById(id);
    return NextResponse.json({ affiliateCode: updatedAffiliateCode });
  } catch (error) {
    console.error('Error updating affiliate code:', error);
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
    
    // Check if affiliate code exists
    const existingCode = await AffiliateCodeModel.getById(id);
    if (!existingCode) {
      return NextResponse.json({ error: 'Affiliate code not found' }, { status: 404 });
    }

    await AffiliateCodeModel.delete(id);
    return NextResponse.json({ message: 'Affiliate code deleted successfully' });
  } catch (error) {
    console.error('Error deleting affiliate code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
