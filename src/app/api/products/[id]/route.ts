import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';
import {requireAuth, isAdmin} from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;
    const product = await ProductModel.getById(_id);
    if (!product) {
      return NextResponse.json({ _error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (_error) {
    console.error('Error fetching product:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;
    
    // Check if product exists
    const existingProduct = await ProductModel.getById(_id);
    if (!existingProduct) {
      return NextResponse.json({ _error: 'Product not found' }, { status: 404 });
    }

    // Validate required fields if provided
    if (_data.name !== undefined && !data.name.trim()) {
      return NextResponse.json({ _error: 'Name cannot be empty' }, { status: 400 });
    }

    if (_data.sku !== undefined && !data.sku.trim()) {
      return NextResponse.json({ _error: 'SKU cannot be empty' }, { status: 400 });
    }

    // Validate price if provided
    if (_data.price !== undefined && (isNaN(_data.price) || data.price < 0)) {
      return NextResponse.json({ 
        _error: 'Price must be a valid positive number' }, { status: 400 });
    }

    // Validate SKU format if provided
    if (_data.sku !== undefined) {
      const skuRegex = /^[A-Za-z0-9_-]+$/;
      if (!skuRegex.test(_data.sku)) {
        return NextResponse.json({ 
          _error: 'SKU can only contain letters, numbers, hyphens, and underscores' }, { status: 400 });
      }

      // Check if SKU already exists for a different product
      const existingSkuProduct = await ProductModel.getBySku(_data.sku);
      if (existingSkuProduct && existingSkuProduct.id !== id) {
        return NextResponse.json({ 
          _error: 'A product with this SKU already exists' }, { status: 400 });
      }
    }

    // Validate image URL if provided
    if (_data.image_url && data.image_url.trim()) {
      try {
        new URL(_data.image_url);
      } catch {
        return NextResponse.json({ 
          _error: 'Invalid image URL format' }, { status: 400 });
      }
    }

    await ProductModel.update(_id, {
      name: data.name,
      description: data.description,
      price: data.price !== undefined ? parseFloat(_data.price) : undefined,
      image_url: data.image_url,
      category_id: data.category_id,
      sku: data.sku,
      is_active: data.is_active
    });

    const updatedProduct = await ProductModel.getById(_id);
    return NextResponse.json({ product: updatedProduct });
  } catch (_error) {
    console.error('Error updating product:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;

    // Check if product exists
    const existingProduct = await ProductModel.getById(_id);
    if (!existingProduct) {
      return NextResponse.json({ _error: 'Product not found' }, { status: 404 });
    }

    await ProductModel.delete(_id);
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (_error) {
    console.error('Error deleting product:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
