import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ProductModel, ProductImageModel, ProductBundleItemModel, ProductCostBreakdownModel } from '@/lib/models';

async function generateUniqueSku(baseSku: string): Promise<string> {
  const cleanBase = (baseSku || 'SKU').trim();
  let candidate = `${cleanBase}-COPY`;
  let i = 2;
  while (true) {
    const existing = await ProductModel.getBySku(candidate);
    if (!existing) return candidate;
    candidate = `${cleanBase}-COPY-${i++}`;
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const product = await ProductModel.getById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Prepare duplicated fields
    const newSku = await generateUniqueSku(product.sku || 'SKU');
    const newName = `${product.name} (Copy)`;

    const newProductId = await ProductModel.create({
      name: newName,
      description: product.description || '',
      price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
      image_url: product.image_url || '',
      data_sheet_url: product.data_sheet_url || '',
      category_id: product.category_id || undefined,
      sku: newSku,
      slug: undefined, // let model util generate from name + sku
      tax_percentage: product.tax_percentage !== null && product.tax_percentage !== undefined
        ? Number(product.tax_percentage)
        : 0,
      shipping_methods: product.shipping_methods || [],
      is_bundle: !!product.is_bundle,
      bundle_pricing_type: (product as any).bundle_pricing_type || 'calculated',
      bundle_discount_percentage: product.bundle_discount_percentage !== null && product.bundle_discount_percentage !== undefined
        ? parseFloat(String(product.bundle_discount_percentage))
        : 0,
      is_active: !!product.is_active,
    });

    // Duplicate images
    const images = await ProductImageModel.getByProductId(id);
    for (const img of images) {
      await ProductImageModel.create({
        product_id: newProductId,
        image_url: img.image_url,
        alt_text: img.alt_text || undefined,
        sort_order: img.sort_order || 0,
      });
    }

    // Duplicate cost breakdowns
    const breakdowns = await ProductCostBreakdownModel.getByProductId(id);
    for (const b of breakdowns) {
      await ProductCostBreakdownModel.create({
        product_id: newProductId,
        category_id: b.category_id,
        calculation_type: b.calculation_type,
        value: typeof b.value === 'string' ? parseFloat(b.value as any) : (b.value as number),
      });
    }

    // Duplicate bundle items if bundle
    if (product.is_bundle) {
      const bundleItems = await ProductBundleItemModel.getByBundleId(id);
      let order = 0;
      for (const bi of bundleItems) {
        await ProductBundleItemModel.create({
          bundle_product_id: newProductId,
          component_product_id: bi.component_product_id,
          quantity: bi.quantity,
          sort_order: bi.sort_order ?? order++,
        });
      }
    }

    const created = await ProductModel.getById(newProductId);
    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

