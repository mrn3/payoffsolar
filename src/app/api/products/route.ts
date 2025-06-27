import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category') || '';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const offset = (page - 1) * limit;

    let products;
    let total;

    if (search && categoryId) {
      if (includeInactive) {
        products = await ProductModel.searchByCategoryIncludingInactive(search, categoryId, limit, offset);
        total = await ProductModel.getSearchByCategoryCountIncludingInactive(search, categoryId);
      } else {
        products = await ProductModel.searchByCategory(search, categoryId, limit, offset);
        total = await ProductModel.getSearchByCategoryCount(search, categoryId);
      }
    } else if (search) {
      if (includeInactive) {
        products = await ProductModel.searchIncludingInactive(search, limit, offset);
        total = await ProductModel.getSearchCountIncludingInactive(search);
      } else {
        products = await ProductModel.search(search, limit, offset);
        total = await ProductModel.getSearchCount(search);
      }
    } else if (categoryId) {
      if (includeInactive) {
        products = await ProductModel.getByCategoryIncludingInactive(categoryId, limit, offset);
        total = await ProductModel.getCategoryCountIncludingInactive(categoryId);
      } else {
        products = await ProductModel.getByCategory(categoryId, limit, offset);
        total = await ProductModel.getCategoryCount(categoryId);
      }
    } else if (includeInactive) {
      products = await ProductModel.getAllIncludingInactive(limit, offset);
      total = await ProductModel.getTotalCount();
    } else {
      products = await ProductModel.getAll(limit, offset);
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
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.sku || data.price === undefined) {
      return NextResponse.json({
        error: 'Name, SKU, and price are required' }, { status: 400 });
    }

    // Validate price is a positive number
    if (isNaN(data.price) || data.price < 0) {
      return NextResponse.json({
        error: 'Price must be a valid positive number' }, { status: 400 });
    }

    // Validate SKU format (alphanumeric, hyphens, underscores, asterisks, periods, plus signs, forward slashes, spaces)
    const skuRegex = /^[A-Za-z0-9_*\-+./\s]+$/;
    if (!skuRegex.test(data.sku)) {
      return NextResponse.json({
        error: 'SKU can only contain letters, numbers, hyphens, underscores, asterisks, periods, plus signs, forward slashes, and spaces' }, { status: 400 });
    }

    // Check if SKU already exists
    const existingProduct = await ProductModel.getBySku(data.sku);
    if (existingProduct) {
      return NextResponse.json({
        error: 'A product with this SKU already exists' }, { status: 400 });
    }

    // Validate tax percentage if provided
    if (data.tax_percentage !== undefined && data.tax_percentage !== null) {
      const taxPercentage = parseFloat(data.tax_percentage);
      if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
        return NextResponse.json({
          error: 'Tax percentage must be a valid number between 0 and 100' }, { status: 400 });
      }
    }

    // Validate image URL if provided
    if (data.image_url && data.image_url.trim()) {
      try {
        new URL(data.image_url);
      } catch {
        return NextResponse.json({
          error: 'Invalid image URL format' }, { status: 400 });
      }
    }

    const productId = await ProductModel.create({
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      tax_percentage: data.tax_percentage !== undefined ? parseFloat(data.tax_percentage) : 0,
      image_url: data.image_url || null,
      data_sheet_url: data.data_sheet_url || null,
      category_id: data.category_id || null,
      sku: data.sku,
      slug: data.slug,
      is_active: data.is_active !== undefined ? data.is_active : true
    });

    const newProduct = await ProductModel.getById(productId);
    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
