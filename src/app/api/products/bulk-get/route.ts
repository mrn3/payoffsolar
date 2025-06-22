import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

interface BulkGetRequest {
  productIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { productIds }: BulkGetRequest = await request.json();

    // Validate input
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({
        error: 'Product IDs array is required and must not be empty'
      }, { status: 400 });
    }

    // Fetch the products
    const products = [];
    const notFoundIds = [];

    // Get all products once to avoid multiple database calls
    const allProducts = await ProductModel.getAll(1000, 0);

    for (const productId of productIds) {
      try {
        const product = allProducts.find(p => p.id === productId);

        if (product) {
          products.push(product);
        } else {
          notFoundIds.push(productId);
        }
      } catch (error) {
        console.error(`Error processing product ${productId}:`, error);
        notFoundIds.push(productId);
      }
    }

    const response: any = {
      products,
      totalProducts: products.length
    };

    if (notFoundIds.length > 0) {
      response.notFoundIds = notFoundIds;
      response.warning = `${notFoundIds.length} product${notFoundIds.length !== 1 ? 's' : ''} could not be found`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in bulk get products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
