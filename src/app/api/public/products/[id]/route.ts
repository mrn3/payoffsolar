import { NextRequest, NextResponse } from 'next/server';
import {ProductModel, ProductImageModel, ProductCategoryModel} from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch product details
    const product = await ProductModel.getById(id);
    if (!product || !product.is_active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch product images
    const images = await ProductImageModel.getByProductId(id);

    // Fetch category name if product has a category
    let categoryName = null;
    if (product.category_id) {
      const category = await ProductCategoryModel.getById(product.category_id);
      categoryName = category?.name;
    }

    const productWithDetails = {
      ...product,
      category_name: categoryName,
      images,
    };

    return NextResponse.json({ product: productWithDetails });
  } catch (error) {
    console.error('Error fetching public product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
