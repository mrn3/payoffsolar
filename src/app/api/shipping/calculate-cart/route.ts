import { NextRequest, NextResponse } from 'next/server';
import { ShippingService } from '@/lib/services/shipping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shippingAddress } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    // Shipping address is optional for local pickup methods
    if (shippingAddress && (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip)) {
      return NextResponse.json(
        { error: 'Complete shipping address is required when provided (address, city, state, zip)' },
        { status: 400 }
      );
    }

    // Validate cart items structure
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each cart item must have a valid productId and quantity' },
          { status: 400 }
        );
      }
    }

    // Calculate shipping for the cart
    const result = await ShippingService.calculateCartShipping(items, shippingAddress ? {
      address: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.zip,
      country: shippingAddress.country || 'US'
    } : null);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error calculating cart shipping:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
