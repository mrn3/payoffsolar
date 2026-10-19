import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/catalog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || '';
    const categoryId = searchParams.get('category') || '';
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1) {
      return NextResponse.json({ error: 'Page and limit must be positive integers' }, { status: 400 });
    }
    return NextResponse.json(await getCatalog({ page, limit, search, sort, category: categoryId }));
  } catch (error) {
    console.error('Error fetching public products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
