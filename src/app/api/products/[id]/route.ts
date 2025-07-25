import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';
import {requireAuth, isAdmin} from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const product = await ProductModel.getById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if product exists
    const existingProduct = await ProductModel.getById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate required fields if provided
    if (data.name !== undefined && !data.name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (data.sku !== undefined && !data.sku.trim()) {
      return NextResponse.json({ error: 'SKU cannot be empty' }, { status: 400 });
    }

    // Validate price if provided
    if (data.price !== undefined && (isNaN(data.price) || data.price < 0)) {
      return NextResponse.json({
        error: 'Price must be a valid positive number' }, { status: 400 });
    }

    // Validate SKU format if provided
    if (data.sku !== undefined) {
      const skuRegex = /^[A-Za-z0-9_*\-+./\s]+$/;
      if (!skuRegex.test(data.sku)) {
        return NextResponse.json({
          error: 'SKU can only contain letters, numbers, hyphens, underscores, asterisks, periods, plus signs, forward slashes, and spaces' }, { status: 400 });
      }

      // Check if SKU already exists for a different product
      const existingSkuProduct = await ProductModel.getBySku(data.sku);
      if (existingSkuProduct && existingSkuProduct.id !== id) {
        return NextResponse.json({
          error: 'A product with this SKU already exists' }, { status: 400 });
      }
    }

    // Validate tax percentage if provided
    if (data.tax_percentage !== undefined && data.tax_percentage !== null) {
      const taxPercentage = parseFloat(data.tax_percentage);
      if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
        return NextResponse.json({
          error: 'Tax percentage must be a valid number between 0 and 100' }, { status: 400 });
      }
    }

    // Validate slug if provided
    if (data.slug !== undefined && data.slug.trim()) {
      const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      if (!slugRegex.test(data.slug)) {
        return NextResponse.json({
          error: 'Slug can only contain lowercase letters, numbers, and hyphens (no spaces or special characters)' }, { status: 400 });
      }

      // Check if slug already exists for a different product
      const existingSlugProduct = await ProductModel.getBySlug(data.slug);
      if (existingSlugProduct && existingSlugProduct.id !== id) {
        return NextResponse.json({
          error: 'A product with this slug already exists' }, { status: 400 });
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

    // Validate bundle discount percentage if provided
    if (data.bundle_discount_percentage !== undefined && data.bundle_discount_percentage !== null) {
      const discountPercentage = parseFloat(data.bundle_discount_percentage);
      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
        return NextResponse.json({
          error: 'Bundle discount percentage must be a valid number between 0 and 100' }, { status: 400 });
      }
    }

    await ProductModel.update(id, {
      name: data.name,
      description: data.description,
      price: data.price !== undefined ? parseFloat(data.price) : undefined,
      tax_percentage: data.tax_percentage !== undefined ? parseFloat(data.tax_percentage) : undefined,
      bundle_discount_percentage: data.bundle_discount_percentage !== undefined ? parseFloat(data.bundle_discount_percentage) : undefined,
      image_url: data.image_url,
      data_sheet_url: data.data_sheet_url,
      category_id: data.category_id,
      sku: data.sku,
      slug: data.slug,
      shipping_methods: data.shipping_methods,
      is_bundle: data.is_bundle,
      bundle_pricing_type: data.bundle_pricing_type,
      is_active: data.is_active
    });

    const updatedProduct = await ProductModel.getById(id);
    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Check if product exists
    const existingProduct = await ProductModel.getById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await ProductModel.delete(id);
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
