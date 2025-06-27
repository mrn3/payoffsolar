import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { AffiliateCodeModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const affiliateCodes = await AffiliateCodeModel.getAll(limit, offset);

    return NextResponse.json({
      affiliateCodes,
      pagination: {
        page,
        limit,
        total: affiliateCodes.length,
        hasMore: affiliateCodes.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate codes:', error);
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
    if (!data.code || !data.discount_type || data.discount_value === undefined) {
      return NextResponse.json({
        error: 'Code, discount type, and discount value are required'
      }, { status: 400 });
    }

    // Validate discount type
    if (!['percentage', 'fixed_amount'].includes(data.discount_type)) {
      return NextResponse.json({
        error: 'Discount type must be "percentage" or "fixed_amount"'
      }, { status: 400 });
    }

    // Validate discount value
    const discountValue = parseFloat(data.discount_value);
    if (isNaN(discountValue) || discountValue <= 0) {
      return NextResponse.json({
        error: 'Discount value must be a positive number'
      }, { status: 400 });
    }

    // Validate percentage range
    if (data.discount_type === 'percentage' && discountValue > 100) {
      return NextResponse.json({
        error: 'Percentage discount cannot exceed 100%'
      }, { status: 400 });
    }

    // Check if code already exists
    const existingCode = await AffiliateCodeModel.getByCode(data.code.toUpperCase());
    if (existingCode) {
      return NextResponse.json({
        error: 'Affiliate code already exists'
      }, { status: 400 });
    }

    const affiliateCodeId = await AffiliateCodeModel.create({
      code: data.code.toUpperCase(),
      name: data.name || null,
      discount_type: data.discount_type,
      discount_value: discountValue,
      is_active: data.is_active !== undefined ? data.is_active : true,
      expires_at: data.expires_at || null,
      usage_limit: data.usage_limit || null
    });

    const affiliateCode = await AffiliateCodeModel.getById(affiliateCodeId);
    return NextResponse.json({ affiliateCode }, { status: 201 });
  } catch (error) {
    console.error('Error creating affiliate code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
