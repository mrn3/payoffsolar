import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { AffiliateCodeModel, OrderModel, OrderItemModel, ContactModel, ProductModel, ProductCostBreakdownModel, CostItemModel } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);

        // Track affiliate code usage if present
        const affiliateCodeId = paymentIntent.metadata.affiliate_code_id;
        if (affiliateCodeId) {
          try {
            await AffiliateCodeModel.incrementUsage(affiliateCodeId);
            console.log('Incremented affiliate code usage:', paymentIntent.metadata.affiliate_code);
          } catch (error) {
            console.error('Error incrementing affiliate code usage:', error);
            // Don't fail the webhook for this error
          }
        }

        // Track purchase in Google Analytics
        try {
          // Note: This runs server-side, so we can't directly call gtag
          // In a production app, you might want to queue this for client-side tracking
          // or use Google Analytics Measurement Protocol for server-side tracking
          console.log('Purchase completed for tracking:', {
            transaction_id: paymentIntent.id,
            value: paymentIntent.amount / 100, // Convert cents to dollars
            currency: paymentIntent.currency.toUpperCase(),
            customer_email: paymentIntent.metadata.customer_email
          });
        } catch (error) {
          console.error('Error logging purchase for analytics:', error);
        }

        // Create order record in database
        try {
          await createOrderFromPaymentIntent(paymentIntent);
          console.log('Order created successfully for payment:', paymentIntent.id);
        } catch (error) {
          console.error('Error creating order from payment intent:', error);
          // Don't fail the webhook for this error, but log it for investigation
        }

        // Here you could also:
        // - Send confirmation emails
        // - Update inventory
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function createOrderFromPaymentIntent(paymentIntent: any) {
  // Extract customer info from metadata
  const customerEmail = paymentIntent.metadata.customer_email;
  const customerName = paymentIntent.metadata.customer_name;
  const total = parseFloat(paymentIntent.metadata.total || '0');

  if (!customerEmail || !customerName) {
    throw new Error('Missing customer information in payment intent metadata');
  }

  // Create or find contact
  let contact = await ContactModel.getByEmail(customerEmail);

  if (!contact) {
    // Create new contact
    const contactId = await ContactModel.create({
      name: customerName,
      email: customerEmail,
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      notes: 'Created from online order',
    });

    contact = await ContactModel.getById(contactId);
  }

  if (!contact) {
    throw new Error('Failed to create or find contact');
  }

  // Check if order already exists for this payment intent
  const existingOrders = await OrderModel.getAll(1000, 0);
  const existingOrder = existingOrders.find(order =>
    order.notes && order.notes.includes(`Payment ID: ${paymentIntent.id}`)
  );

  if (existingOrder) {
    console.log(`Order already exists for payment intent ${paymentIntent.id}`);
    return existingOrder.id;
  }

  // Create order
  const orderId = await OrderModel.create({
    contact_id: contact.id,
    status: 'Paid',
    total: total,
    order_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    notes: `Online order - Payment ID: ${paymentIntent.id}`,
  });

  // Create order items from metadata
  const itemsData = paymentIntent.metadata.items_data;
  let items = [];
  if (itemsData) {
    try {
      items = JSON.parse(itemsData);
      for (const item of items) {
        await OrderItemModel.create({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        });
      }
      console.log(`Created ${items.length} order items for order ${orderId}`);
    } catch (error) {
      console.error('Error parsing items data from payment intent metadata:', error);
    }
  } else {
    console.warn('No items data found in payment intent metadata');
  }

  // Generate cost items from product default cost breakdowns
  if (items.length > 0) {
    try {
      const allCostItems = [];
      for (const item of items) {
        const productCostItems = await ProductCostBreakdownModel.calculateCostItems(
          item.product_id,
          parseInt(item.quantity),
          parseFloat(item.price)
        );
        allCostItems.push(...productCostItems);
      }

      // Merge cost items by category (sum amounts for same category)
      const mergedCostItems = new Map();
      for (const costItem of allCostItems) {
        const key = costItem.category_id;
        if (mergedCostItems.has(key)) {
          const existing = mergedCostItems.get(key);
          existing.amount += costItem.amount;
        } else {
          mergedCostItems.set(key, { ...costItem });
        }
      }

      // Create the merged cost items
      for (const costItem of mergedCostItems.values()) {
        await CostItemModel.create({
          order_id: orderId,
          category_id: costItem.category_id,
          amount: costItem.amount
        });
      }

      console.log(`Created ${mergedCostItems.size} cost items for order ${orderId}`);
    } catch (error) {
      console.error('Error generating cost breakdown for order:', error);
      // Don't fail the webhook for this error, but log it for investigation
    }
  }

  return orderId;
}
