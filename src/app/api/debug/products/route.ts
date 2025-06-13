import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const products = await ProductModel.getAllIncludingInactive(10, 0);
    return NextResponse.json({ 
      products: products.map(p => ({ id: p.id, name: p.name, sku: p.sku }))
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
