import { NextRequest, NextResponse } from 'next/server';
import stripe, { formatAmountForStripe } from '@/lib/stripe';
import { CartItem } from '@/lib/models';

export async function POST(_request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shipping, customerInfo } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { _error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!customerInfo || !customerInfo.email) {
      return NextResponse.json(
        { _error: 'Customer email is required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((total: number, item: CartItem) => {
      return total + (item.product_price * item.quantity);
    }, 0);

    const shippingCost = shipping?.cost || 0;
    const taxRate = 0.085; // 8.5% tax rate
    const tax = subtotal * taxRate;
    const total = subtotal + shippingCost + tax;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(total),
      currency: 'usd',
      metadata: {
        subtotal: subtotal.toString(),
        shipping: shippingCost.toString(),
        tax: tax.toString(),
        total: total.toString(),
        customer_email: customerInfo.email,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        items_count: items.length.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
    });
  } catch (_error) {
    console.error('Error creating payment intent:', _error);
    return NextResponse.json(
      { _error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
