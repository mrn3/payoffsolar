import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';

export async function GET(_request: NextRequest) {
  try {
    const products = await ProductModel.getAllIncludingInactive(10, 0);
    return NextResponse.json({ 
      products: products.map(p => ({ _id: p.id, name: p.name, sku: p.sku }))
    });
  } catch (_error) {
    console.error('Error fetching products:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
