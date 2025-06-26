import { NextRequest, NextResponse } from 'next/server';
import { ProductModel, ProductImageModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { executeSingle } from '@/lib/mysql/connection';
import { smartMergeProducts } from '@/lib/utils/duplicates';

interface MergeRequest {
  primaryProductId: string;
  duplicateProductId: string;
  mergedData?: {
    name: string;
    description: string;
    price: number;
    image_url?: string;
    data_sheet_url?: string;
    category_id?: string;
    sku: string;
    is_active: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { primaryProductId, duplicateProductId, mergedData }: MergeRequest = await request.json();

    // Validate input
    if (!primaryProductId || !duplicateProductId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (primaryProductId === duplicateProductId) {
      return NextResponse.json({ error: 'Cannot merge a product with itself' }, { status: 400 });
    }

    // Verify both products exist
    const primaryProduct = await ProductModel.getById(primaryProductId);
    const duplicateProduct = await ProductModel.getById(duplicateProductId);

    if (!primaryProduct || !duplicateProduct) {
      return NextResponse.json({ error: 'One or both products not found' }, { status: 404 });
    }

    // Generate smart merged data if not provided
    const finalMergedData = mergedData || smartMergeProducts(primaryProduct, duplicateProduct);

    // Check if the merged SKU would conflict with another product (excluding the two being merged)
    if (finalMergedData.sku) {
      const existingProduct = await ProductModel.getBySku(finalMergedData.sku);
      if (existingProduct && existingProduct.id !== primaryProductId && existingProduct.id !== duplicateProductId) {
        return NextResponse.json({
          error: 'SKU already exists for another product'
        }, { status: 400 });
      }
    }

    // Start transaction-like operations
    try {
      // 1. Update any order items that reference the duplicate product to reference the primary product
      await executeSingle(
        'UPDATE order_items SET product_id = ? WHERE product_id = ?',
        [primaryProductId, duplicateProductId]
      );

      // 2. Update any inventory records that reference the duplicate product to reference the primary product
      await executeSingle(
        'UPDATE inventory SET product_id = ? WHERE product_id = ?',
        [primaryProductId, duplicateProductId]
      );

      // 3. Transfer product images from duplicate to primary product (if any)
      const duplicateImages = await ProductImageModel.getByProductId(duplicateProductId);
      if (duplicateImages.length > 0) {
        // Get the current max sort order for the primary product
        const primaryImages = await ProductImageModel.getByProductId(primaryProductId);
        let maxSortOrder = primaryImages.length > 0 ? Math.max(...primaryImages.map(img => img.sort_order)) : 0;

        // Transfer images with updated sort order
        for (const image of duplicateImages) {
          await executeSingle(
            'UPDATE product_images SET product_id = ?, sort_order = ? WHERE id = ?',
            [primaryProductId, ++maxSortOrder, image.id]
          );
        }
      }

      // 4. Update the primary product with merged data
      await ProductModel.update(primaryProductId, {
        name: finalMergedData.name,
        description: finalMergedData.description,
        price: finalMergedData.price,
        image_url: finalMergedData.image_url,
        data_sheet_url: finalMergedData.data_sheet_url,
        category_id: finalMergedData.category_id,
        sku: finalMergedData.sku,
        is_active: finalMergedData.is_active
      });

      // 5. Delete the duplicate product (this will cascade delete any remaining references)
      await ProductModel.delete(duplicateProductId);

      // 6. Get the updated primary product
      const updatedProduct = await ProductModel.getById(primaryProductId);

      return NextResponse.json({ 
        success: true,
        mergedProduct: updatedProduct,
        message: 'Products merged successfully'
      });

    } catch (mergeError) {
      console.error('Error during merge operation:', mergeError);
      return NextResponse.json({
        error: 'Failed to merge products. Please try again.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error merging products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
