import { NextRequest, NextResponse } from 'next/server';
import { ProductModel, ProductBundleItemModel } from '@/lib/models';
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
    const bundleProduct = await ProductModel.getById(id);
    if (!bundleProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!bundleProduct.is_bundle) {
      return NextResponse.json({ error: 'Product is not a bundle' }, { status: 400 });
    }

    // Get bundle items with component product details
    const bundleItems = await ProductBundleItemModel.getByBundleId(id);

    // Calculate pricing
    const bundlePricing = await ProductBundleItemModel.calculateBundlePrice(id);
    
    let finalPrice = parseFloat(bundleProduct.price) || 0;
    let calculatedPrice = parseFloat(bundlePricing.totalPrice) || 0;

    if (bundleProduct.bundle_pricing_type === 'calculated') {
      const discountAmount = (parseFloat(bundlePricing.totalPrice) * parseFloat(bundleProduct.bundle_discount_percentage)) / 100;
      calculatedPrice = parseFloat(bundlePricing.totalPrice) - discountAmount;
      finalPrice = calculatedPrice;
    }

    const response = {
      bundleItems,
      pricing: {
        componentCount: bundlePricing.componentCount,
        totalComponentPrice: parseFloat(bundlePricing.totalPrice) || 0,
        discountPercentage: parseFloat(bundleProduct.bundle_discount_percentage) || 0,
        discountAmount: bundleProduct.bundle_pricing_type === 'calculated'
          ? (parseFloat(bundlePricing.totalPrice) * parseFloat(bundleProduct.bundle_discount_percentage)) / 100
          : 0,
        calculatedPrice,
        finalPrice,
        pricingType: bundleProduct.bundle_pricing_type,
        savings: bundleProduct.bundle_pricing_type === 'calculated'
          ? parseFloat(bundlePricing.totalPrice) - calculatedPrice
          : 0
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating bundle pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
