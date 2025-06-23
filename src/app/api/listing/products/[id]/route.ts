import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ProductListingModel } from '@/lib/models';

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

    const listings = await ProductListingModel.getByProductId(id);

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error fetching product listings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
