import { NextRequest, NextResponse } from 'next/server';
import { ProductBundleItemModel, ProductModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleItems = await ProductBundleItemModel.getByBundleId(params.id);
    return NextResponse.json({ bundleItems });
  } catch (error) {
    console.error('Error fetching bundle items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.component_product_id || !data.quantity) {
      return NextResponse.json({
        error: 'Component product ID and quantity are required'
      }, { status: 400 });
    }

    // Validate quantity is a positive number
    if (isNaN(data.quantity) || data.quantity <= 0) {
      return NextResponse.json({
        error: 'Quantity must be a positive number'
      }, { status: 400 });
    }

    // Check if bundle product exists and is a bundle
    const bundleProduct = await ProductModel.getById(params.id);
    if (!bundleProduct) {
      return NextResponse.json({ error: 'Bundle product not found' }, { status: 404 });
    }

    if (!bundleProduct.is_bundle) {
      return NextResponse.json({
        error: 'Product is not configured as a bundle'
      }, { status: 400 });
    }

    // Check if component product exists
    const componentProduct = await ProductModel.getById(data.component_product_id);
    if (!componentProduct) {
      return NextResponse.json({ error: 'Component product not found' }, { status: 404 });
    }

    // Prevent adding a bundle as a component of itself
    if (params.id === data.component_product_id) {
      return NextResponse.json({
        error: 'Cannot add a bundle as a component of itself'
      }, { status: 400 });
    }

    // Prevent circular dependencies (basic check)
    if (componentProduct.is_bundle) {
      const componentBundleItems = await ProductBundleItemModel.getByBundleId(data.component_product_id);
      const hasCircularDependency = componentBundleItems.some(
        item => item.component_product_id === params.id
      );
      
      if (hasCircularDependency) {
        return NextResponse.json({
          error: 'Cannot add component: would create circular dependency'
        }, { status: 400 });
      }
    }

    const bundleItemId = await ProductBundleItemModel.create({
      bundle_product_id: params.id,
      component_product_id: data.component_product_id,
      quantity: parseInt(data.quantity),
      sort_order: data.sort_order || 0
    });

    const newBundleItem = await ProductBundleItemModel.getByBundleId(params.id);
    return NextResponse.json({ bundleItems: newBundleItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating bundle item:', error);
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json({
        error: 'Component product is already part of this bundle'
      }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ProductBundleItemModel.deleteByBundleId(params.id);
    return NextResponse.json({ message: 'All bundle items deleted successfully' });
  } catch (error) {
    console.error('Error deleting bundle items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
