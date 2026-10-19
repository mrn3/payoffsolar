import { NextRequest, NextResponse } from 'next/server';
import { getProduct } from '@/lib/catalog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch product details
    const product = await getProduct(id, 'id');
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching public product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
