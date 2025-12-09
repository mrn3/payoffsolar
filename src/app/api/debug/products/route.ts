import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    // Do not expose this debug endpoint in production for safety
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Require an authenticated admin session in non-production environments
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const products = await ProductModel.getAllIncludingInactive(10, 0);
    return NextResponse.json({ 
      products: products.map(p => ({ _id: p.id, name: p.name, sku: p.sku }))
    });
  } catch (_error) {
    console.error('Error fetching products:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
