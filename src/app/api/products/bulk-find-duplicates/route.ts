import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { findProductDuplicates } from '@/lib/utils/duplicates';

interface BulkFindDuplicatesRequest {
  productIds: string[];
  threshold?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { productIds, threshold = 70 }: BulkFindDuplicatesRequest = await request.json();

    // Validate input
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({
        error: 'Product IDs array is required and must not be empty'
      }, { status: 400 });
    }

    if (productIds.length < 2) {
      return NextResponse.json({
        duplicateGroups: [],
        totalGroups: 0,
        totalDuplicateProducts: 0,
        message: 'At least 2 products are required to find duplicates'
      });
    }

    // Fetch the selected products
    const products = [];
    const notFoundIds = [];

    for (const productId of productIds) {
      try {
        // Get product by ID
        const product = await ProductModel.getById(productId);

        if (product) {
          // Get all products to find the one with first_image_url
          const allProducts = await ProductModel.getAll(1000, 0);
          const productWithImage = allProducts.find(p => p.id === productId);

          if (productWithImage) {
            products.push(productWithImage);
          } else {
            products.push({
              ...product,
              first_image_url: null,
              category_name: null
            });
          }
        } else {
          notFoundIds.push(productId);
        }
      } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        notFoundIds.push(productId);
      }
    }

    if (products.length < 2) {
      return NextResponse.json({
        duplicateGroups: [],
        totalGroups: 0,
        totalDuplicateProducts: 0,
        message: 'At least 2 valid products are required to find duplicates',
        notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined
      });
    }

    // Find duplicates among the selected products
    const duplicateGroups = findProductDuplicates(products, threshold);

    const response: any = {
      duplicateGroups,
      totalGroups: duplicateGroups.length,
      totalDuplicateProducts: duplicateGroups.reduce((sum, group) => sum + group.products.length, 0),
      totalProductsChecked: products.length,
      threshold
    };

    if (notFoundIds.length > 0) {
      response.notFoundIds = notFoundIds;
      response.warning = `${notFoundIds.length} product${notFoundIds.length !== 1 ? 's' : ''} could not be found`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in bulk find duplicates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
