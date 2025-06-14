import { NextRequest, NextResponse } from 'next/server';
import { requireAuth , isAdmin} from '@/lib/auth';

interface ImportProduct {
  name: string;
  description?: string;
  price: string | number;
  sku: string;
  category_id?: string;
  category_name?: string;
  image_url?: string;
  is_active?: boolean | string;
}

export async function POST(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { products } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ _error: 'No products provided' }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Get all categories for mapping
    const categories = await ProductCategoryModel.getAll();
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
      categoryMap.set(cat.id, cat.id);
    });

    for (let i = 0; i < products.length; i++) {
      const product = products[i] as ImportProduct;
      
      try {
        // Validate required fields
        if (!product.name || !product.name.toString().trim()) {
          throw new Error(`Row ${i + 1}: Product name is required`);
        }

        if (!product.sku || !product.sku.toString().trim()) {
          throw new Error(`Row ${i + 1}: SKU is required`);
        }

        if (!product.price || isNaN(Number(product.price))) {
          throw new Error(`Row ${i + 1}: Valid price is required`);
        }

        // Check for duplicate SKU
        const existingProduct = await ProductModel.getBySku(product.sku.toString().trim());
        if (existingProduct) {
          throw new Error(`Row ${i + 1}: SKU '${product.sku}' already exists`);
        }

        // Map category if provided
                if (product.category_name && product.category_name.toString().trim()) {
          const categoryKey = product.category_name.toString().toLowerCase().trim();
          _categoryId = categoryMap.get(categoryKey) || null;
        } else if (product.category_id && product.category_id.toString().trim()) {
          _categoryId = categoryMap.get(product.category_id.toString().trim()) || null;
        }

        // Parse is_active field
        let isActive = true;
        if (product.is_active !== undefined) {
          if (typeof product.is_active === 'boolean') {
            isActive = product.is_active;
          } else {
            const activeStr = product.is_active.toString().toLowerCase().trim();
            isActive = activeStr === 'true' || activeStr === '1' || activeStr === 'yes' || activeStr === 'active';
          }
        }

        // Create product
        await ProductModel.create({
          name: product.name.toString().trim(),
          description: product.description?.toString().trim() || '',
          price: parseFloat(product.price.toString()),
          sku: product.sku.toString().trim(),
          category_id: categoryId,
          image_url: product.image_url?.toString().trim() || null,
          is_active: isActive
        });

        successCount++;
      } catch (_error) {
        errorCount++;
        const errorMessage = error instanceof Error ? _error.message : `Row ${i + 1}: Unknown error`;
        errors.push(errorMessage);
        console.error(`Error importing product at row ${i + 1}:`, _error);
      }
    }

    return NextResponse.json({
      success: successCount,
      errors: errorCount,
      errorDetails: errors
    });

  } catch (_error) {
    console.error('Error in bulk product import:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
