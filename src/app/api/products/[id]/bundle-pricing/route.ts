import { NextRequest, NextResponse } from 'next/server';
import { ProductModel, ProductBundleItemModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const bundleProduct = await ProductModel.getById(params.id);
    if (!bundleProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!bundleProduct.is_bundle) {
      return NextResponse.json({ error: 'Product is not a bundle' }, { status: 400 });
    }

    // Get bundle items with component product details
    const bundleItems = await ProductBundleItemModel.getByBundleId(params.id);
    
    // Calculate pricing
    const bundlePricing = await ProductBundleItemModel.calculateBundlePrice(params.id);
    
    let finalPrice = bundleProduct.price;
    let calculatedPrice = bundlePricing.totalPrice;
    
    if (bundleProduct.bundle_pricing_type === 'calculated') {
      const discountAmount = (bundlePricing.totalPrice * bundleProduct.bundle_discount_percentage) / 100;
      calculatedPrice = bundlePricing.totalPrice - discountAmount;
      finalPrice = calculatedPrice;
    }

    return NextResponse.json({
      bundleItems,
      pricing: {
        componentCount: bundlePricing.componentCount,
        totalComponentPrice: bundlePricing.totalPrice,
        discountPercentage: bundleProduct.bundle_discount_percentage,
        discountAmount: bundleProduct.bundle_pricing_type === 'calculated' 
          ? (bundlePricing.totalPrice * bundleProduct.bundle_discount_percentage) / 100 
          : 0,
        calculatedPrice,
        finalPrice,
        pricingType: bundleProduct.bundle_pricing_type,
        savings: bundleProduct.bundle_pricing_type === 'calculated' 
          ? bundlePricing.totalPrice - calculatedPrice 
          : 0
      }
    });
  } catch (error) {
    console.error('Error calculating bundle pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
