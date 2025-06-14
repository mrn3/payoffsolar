import { NextRequest, NextResponse } from 'next/server';
import { ProductCategoryModel } from '@/lib/models';

export async function GET(_request: NextRequest) {
  try {
    const categories = await ProductCategoryModel.getAll();
    return NextResponse.json({ categories });
  } catch (_error) {
    console.error('Error fetching public product categories:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
