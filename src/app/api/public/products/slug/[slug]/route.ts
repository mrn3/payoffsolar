import { NextRequest, NextResponse } from 'next/server';
import { ProductModel, ProductImageModel, ProductCategoryModel, InventoryModel, ProductBundleItemModel } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch product details by slug
    const product = await ProductModel.getBySlug(slug);
    if (!product || !product.is_active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch product images
    const images = await ProductImageModel.getByProductId(product.id);

    // Fetch category name if product has a category
    let categoryName = null;
    if (product.category_id) {
      const category = await ProductCategoryModel.getById(product.category_id);
      categoryName = category?.name;
    }

    // Fetch total quantity available across all warehouses
    const quantityAvailable = await InventoryModel.getTotalQuantityByProductId(product.id);

    const productWithDetails = {
      ...product,
      category_name: categoryName,
      images,
      quantity_available: quantityAvailable,
    };

    // If this is a bundle product, fetch bundle items
    if (product.is_bundle) {
      const bundleItems = await ProductBundleItemModel.getByBundleId(product.id);
      productWithDetails.bundle_items = bundleItems;
    }

    return NextResponse.json({ product: productWithDetails });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
