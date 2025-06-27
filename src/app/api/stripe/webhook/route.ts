import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { AffiliateCodeModel } from '@/lib/models';

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

        // Here you could also:
        // - Create an order record in your database
        // - Send confirmation emails
        // - Update inventory
        // - Log analytics events
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
