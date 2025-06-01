import { NextRequest, NextResponse } from 'next/server';
import { ProductImageModel, ProductModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

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
    
    // Check if product exists
    const product = await ProductModel.getById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const images = await ProductImageModel.getByProductId(id);
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    const product = await ProductModel.getById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate required fields
    if (!data.image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Get current images count for sort order
    const existingImages = await ProductImageModel.getByProductId(id);
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

  } catch (error) {
    console.error('Error adding product image:', error);
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
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Check if product exists
    const product = await ProductModel.getById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await ProductImageModel.delete(imageId);

    return NextResponse.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Error deleting product image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
