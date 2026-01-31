import { NextRequest, NextResponse } from 'next/server';
import stripe, { formatAmountForStripe } from '@/lib/stripe';
import { CartItem, AffiliateCode, AffiliateCodeModel } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shipping, customerInfo, affiliateCode } = body;

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

    // Calculate totals with affiliate discount and individual product taxes
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of items) {
      const itemTotal = item.product_price * item.quantity;
      subtotal += itemTotal;

      // Apply affiliate discount if present
      let discountedItemPrice = item.product_price;
      if (affiliateCode) {
        let discount = 0;
        if (affiliateCode.discount_type === 'percentage') {
          discount = (item.product_price * affiliateCode.discount_value / 100);
        } else {
          discount = Math.min(affiliateCode.discount_value, item.product_price);
        }
        totalDiscount += discount * item.quantity;
        discountedItemPrice = Math.max(0, item.product_price - discount);
      }

      // Calculate tax for this item based on its individual tax percentage
      if (item.product_tax_percentage > 0) {
        const itemTax = (discountedItemPrice * item.quantity * item.product_tax_percentage) / 100;
        totalTax += itemTax;
      }
    }

    const discountedSubtotal = subtotal - totalDiscount;
    const shippingCost = shipping?.cost || 0;
    const total = discountedSubtotal + shippingCost + totalTax;

    // Validate affiliate code if provided
    if (affiliateCode) {
      const validation = await AffiliateCodeModel.validateCode(affiliateCode.code);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid affiliate code: ${validation.reason}` },
          { status: 400 }
        );
      }
    }

    // Prepare items data for metadata (simplified for webhook processing)
    const itemsData = items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.product_price
    }));

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(total),
      currency: 'usd',
      metadata: {
	        subtotal: subtotal.toString(),
	        discount: totalDiscount.toString(),
	        discounted_subtotal: discountedSubtotal.toString(),
	        shipping: shippingCost.toString(),
	        shipping_method: shipping?.method || '',
	        shipping_method_label: shipping?.methodLabel || shipping?.method || '',
	        tax: totalTax.toString(),
	        total: total.toString(),
	        customer_email: customerInfo.email,
	        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
	        customer_phone: customerInfo.phone || '',
	        customer_address: customerInfo.address || '',
	        customer_city: customerInfo.city || '',
	        customer_state: customerInfo.state || '',
	        customer_zip: customerInfo.zip || '',
	        items_count: items.length.toString(),
	        affiliate_code: affiliateCode?.code || '',
	        affiliate_code_id: affiliateCode?.id || '',
	        items_data: JSON.stringify(itemsData),
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
