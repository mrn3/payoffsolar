import { NextRequest, NextResponse } from 'next/server';
import { ProductImageModel, ProductModel } from '@/lib/models';
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
    
    // Check if product exists
    const product = await ProductModel.getById(_id);
    if (!product) {
      return NextResponse.json({ _error: 'Product not found' }, { status: 404 });
    }

    const images = await ProductImageModel.getByProductId(_id);
    return NextResponse.json({ images });
  } catch (_error) {
    console.error('Error fetching product images:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    const product = await ProductModel.getById(_id);
    if (!product) {
      return NextResponse.json({ _error: 'Product not found' }, { status: 404 });
    }

    // Validate required fields
    if (!data.image_url) {
      return NextResponse.json({ _error: 'Image URL is required' }, { status: 400 });
    }

    // Get current images count for sort order
    const existingImages = await ProductImageModel.getByProductId(_id);
    const sortOrder = data.sort_order !== undefined ? data.sort_order : existingImages.length;

    const imageId = await ProductImageModel.create({
      product_id: id,
      image_url: data.image_url,
      alt_text: data.alt_text || '',
      sort_order: sortOrder
    });

    return NextResponse.json({ 
      message: 'Image added successfully',
      imageId 
    }, { status: 201 });

  } catch (_error) {
    console.error('Error adding product image:', _error);
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
    const { _searchParams } = new URL(_request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ _error: 'Image ID is required' }, { status: 400 });
    }

    // Check if product exists
    const product = await ProductModel.getById(_id);
    if (!product) {
      return NextResponse.json({ _error: 'Product not found' }, { status: 404 });
    }

    await ProductImageModel.delete(imageId);

    return NextResponse.json({ message: 'Image deleted successfully' });

  } catch (_error) {
    console.error('Error deleting product image:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
