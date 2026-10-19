import { NextRequest, NextResponse } from 'next/server';
import { getProduct } from '@/lib/catalog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch product details by slug
    const product = await getProduct(slug);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
