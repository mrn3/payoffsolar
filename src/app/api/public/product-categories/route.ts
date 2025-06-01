import { NextRequest, NextResponse } from 'next/server';
import { ProductCategoryModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const categories = await ProductCategoryModel.getAll();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching public product categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
