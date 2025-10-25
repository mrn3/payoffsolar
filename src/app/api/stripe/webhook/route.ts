import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { AffiliateCodeModel, OrderModel, OrderItemModel, ContactModel, ProductModel, ProductCostBreakdownModel, CostItemModel } from '@/lib/models';
import { sendEmail } from '@/lib/email';
import { trackOutboundEmail } from '@/lib/communication/tracking';

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

        // Create order record in database and send confirmation email
        try {
          const orderId = await createOrderFromPaymentIntent(paymentIntent);
          console.log('Order created successfully for payment:', paymentIntent.id);

          // Build and send order confirmation email
          try {
            const toEmail = paymentIntent.metadata?.customer_email;
            if (toEmail) {
              const customerName = paymentIntent.metadata?.customer_name || '';
              const itemsDataStr = paymentIntent.metadata?.items_data;
              let items: Array<{ product_id: string; quantity: number; price: number }> = [];
              if (itemsDataStr) {
                try {
                  items = JSON.parse(itemsDataStr);
                } catch (_e) {
                  console.error('Failed to parse items_data metadata:', _e);
                }
              }

              // Enrich items with product details
              const detailedItems: Array<{ name: string; sku: string; quantity: number; price: number }> = [];
              for (const item of items) {
                const product = await ProductModel.getById(item.product_id);
                detailedItems.push({
                  name: product?.name || 'Product',
                  sku: product?.sku || '',
                  quantity: Number(item.quantity) || 0,
                  price: Number(item.price) || 0
                });
              }

              const subtotal = parseFloat(paymentIntent.metadata?.discounted_subtotal || paymentIntent.metadata?.subtotal || '0');
              const shipping = parseFloat(paymentIntent.metadata?.shipping || '0');
              const tax = parseFloat(paymentIntent.metadata?.tax || '0');
              const total = parseFloat(paymentIntent.metadata?.total || '0');
              const shippingMethodLabel = paymentIntent.metadata?.shipping_method_label || paymentIntent.metadata?.shipping_method || '';
              const orderShort = (orderId || paymentIntent.id).toString().substring(0, 8);

              const currencySymbol = '$'; // USD only for now
              const fmt = (n: number) => `${currencySymbol}${n.toFixed(2)}`;

              const itemsHtml = detailedItems.length
                ? detailedItems.map(di => `<tr><td>${di.name}</td><td>${di.sku}</td><td style="text-align:center;">${di.quantity}</td><td style="text-align:right;">${fmt(di.price)}</td><td style="text-align:right;">${fmt(di.price * di.quantity)}</td></tr>`).join('')
                : '<tr><td colspan="5">No items</td></tr>';

              const businessPhone = process.env.BUSINESS_PHONE || '(801) 448-6396';
              const bccEnv = process.env.ORDER_CONFIRMATION_BCC || 'matt@payoffsolar.com';
              const bccList = bccEnv.split(',').map(s => s.trim()).filter(Boolean);

              const html = `
                <!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;padding:20px;">
                  <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb">
                    <h2 style="margin:0 0 8px 0;color:#111827;">Thank you for your order${customerName ? `, ${customerName}` : ''}!</h2>
                    <p style="margin:0 0 16px 0;color:#374151;">Your order has been confirmed.</p>
                    <p style="margin:0 0 16px 0;color:#374151;"><strong>Order #</strong> ${orderShort}</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0">
                      <thead>
                        <tr>
                          <th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:8px 0;color:#374151;">Product</th>
                          <th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:8px 0;color:#374151;">SKU</th>
                          <th style="text-align:center;border-bottom:1px solid #e5e7eb;padding:8px 0;color:#374151;">Qty</th>
                          <th style="text-align:right;border-bottom:1px solid #e5e7eb;padding:8px 0;color:#374151;">Unit</th>
                          <th style="text-align:right;border-bottom:1px solid #e5e7eb;padding:8px 0;color:#374151;">Total</th>
                        </tr>
                      </thead>
                      <tbody>${itemsHtml}</tbody>
                    </table>
                    <div style="text-align:right;">
                      <div><span style="color:#6b7280;">Subtotal:</span> <strong>${fmt(subtotal)}</strong></div>
                      ${shipping ? `<div><span style="color:#6b7280;">Shipping${shippingMethodLabel ? ` (${shippingMethodLabel})` : ''}:</span> <strong>${fmt(shipping)}</strong></div>` : ''}
                      ${tax ? `<div><span style="color:#6b7280;">Tax:</span> <strong>${fmt(tax)}</strong></div>` : ''}
                      <div style="margin-top:8px;font-size:18px;"><span style="color:#111827;">Total:</span> <strong style="color:#16a34a;">${fmt(total)}</strong></div>
                    </div>
                    <p style="margin-top:24px;color:#6b7280;font-size:14px;">Questions? Call us at ${businessPhone}.</p>
                    <p style="margin:0;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} Payoff Solar</p>
                  </div>
                </body></html>
              `;

              const success = await sendEmail({
                to: toEmail,
                subject: `Order Confirmation #${orderShort} - Payoff Solar`,
                html,
                bcc: bccList.length ? bccList : undefined
              });

              if (success) {
                try {
                  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@payoffsolar.com';
                  await trackOutboundEmail({
                    toEmail: toEmail,
                    fromEmail,
                    subject: `Order Confirmation #${orderShort} - Payoff Solar`,
                    bodyHtml: html,
                    bccEmails: bccList.length ? bccList : undefined
                  });
                } catch (trackErr) {
                  console.error('Error tracking order confirmation email:', trackErr);
                }
              }
            } else {
              console.warn('No customer email found on payment intent; skipping confirmation email.');
            }
          } catch (emailErr) {
            console.error('Error sending order confirmation email:', emailErr);
          }
        } catch (error) {
          console.error('Error creating order from payment intent:', error);
          // Don't fail the webhook for this error, but log it for investigation
        }

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
