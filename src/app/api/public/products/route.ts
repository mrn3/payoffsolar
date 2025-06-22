import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || '';
    const categoryId = searchParams.get('category') || '';
    const offset = (page - 1) * limit;

    let products;
    let total;

    if (search && categoryId) {
      products = await ProductModel.searchByCategory(search, categoryId, limit, offset, sort);
      total = await ProductModel.getSearchByCategoryCount(search, categoryId);
    } else if (search) {
      products = await ProductModel.search(search, limit, offset, sort);
      total = await ProductModel.getSearchCount(search);
    } else if (categoryId) {
      products = await ProductModel.getByCategory(categoryId, limit, offset, sort);
      total = await ProductModel.getCategoryCount(categoryId);
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
  } catch (error) {
    console.error('Error fetching public products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
