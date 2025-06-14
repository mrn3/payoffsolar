import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';

export async function GET(_request: NextRequest) {
  try {
    const { _searchParams } = new URL(_request.url);
    const page = parseInt(_searchParams.get('page') || '1');
    const limit = parseInt(_searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
        const sort = searchParams.get('sort') || '';
    const offset = (page - 1) * limit;

    let products;
    let total;

    if (search) {
      products = await ProductModel.search(search, limit, offset, sort);
      total = await ProductModel.getSearchCount(search);
    } else if (_categoryId) {
      products = await ProductModel.getByCategory(_categoryId, limit, offset, sort);
      total = await ProductModel.getCategoryCount(_categoryId);
    } else {
      products = await ProductModel.getAll(limit, offset, sort);
      total = await ProductModel.getCount();
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (_error) {
    console.error('Error fetching public products:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
