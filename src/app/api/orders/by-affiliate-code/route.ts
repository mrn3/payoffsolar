import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, AffiliateCodeModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const affiliateCodeId = searchParams.get('affiliateCodeId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortField = searchParams.get('sortField') || 'order_date';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    if (!affiliateCodeId) {
      return NextResponse.json({ error: 'Affiliate code ID is required' }, { status: 400 });
    }

    const affiliateCode = await AffiliateCodeModel.getById(affiliateCodeId);
    if (!affiliateCode) {
      return NextResponse.json({ error: 'Affiliate code not found' }, { status: 404 });
    }

    const offset = (page - 1) * limit;

    const orders = await OrderModel.getOrdersByAffiliateCode(
      affiliateCodeId,
      limit,
      offset,
      sortField,
      sortDirection
    );

    const total = await OrderModel.getOrdersByAffiliateCodeCount(affiliateCodeId);

    return NextResponse.json({
      orders,
      affiliateCode,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching orders by affiliate code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

