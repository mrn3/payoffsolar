import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ProductListingModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const listings = await ProductListingModel.getAll(limit, offset);

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error fetching all listings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
