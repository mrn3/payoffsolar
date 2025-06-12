# Stripe Setup for Payoff Solar

This document explains how to set up Stripe payment processing for the Payoff Solar e-commerce functionality.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard

## Setup Steps

### 1. Get Your Stripe API Keys

1. Log in to your Stripe Dashboard
2. Navigate to **Developers** > **API keys**
3. Copy your **Publishable key** and **Secret key**
4. For testing, use the test keys (they start with `pk_test_` and `sk_test_`)
5. For production, use the live keys (they start with `pk_live_` and `sk_live_`)

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

**Important:** 
- Never commit your secret key to version control
- The publishable key is safe to expose in client-side code
- Use test keys during development and live keys in production

### 3. Test the Integration

1. Start your development server: `npm run dev`
2. Add products to your cart
3. Go through the checkout process
4. Use Stripe's test card numbers:
   - **Success:** `4242 4242 4242 4242`
   - **Decline:** `4000 0000 0000 0002`
   - **Requires authentication:** `4000 0025 0000 3155`
   - Use any future expiry date, any 3-digit CVC, and any ZIP code

### 4. Webhook Configuration (Optional)

For production, you may want to set up webhooks to handle payment events:

1. In your Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select the events you want to listen for (e.g., `payment_intent.succeeded`)

## Features Implemented

### Shopping Cart
- Add/remove items from cart
- Update quantities
- Persistent cart storage (localStorage)
- Cart sidebar with quick actions

### Checkout Process
- Customer information collection
- Shipping address form
- Shipping method selection
- Tax calculation
- Order summary

### Payment Processing
- Stripe Payment Intents API
- Secure payment form (to be implemented with Stripe Elements)
- Payment confirmation
- Order creation upon successful payment

### Order Management
- Automatic order creation from successful payments
- Contact creation/lookup
- Order status tracking
- Integration with existing admin order system

## Security Considerations

1. **API Keys:** Keep your secret key secure and never expose it in client-side code
2. **Payment Validation:** Always verify payments server-side before fulfilling orders
3. **HTTPS:** Use HTTPS in production for secure payment processing
4. **PCI Compliance:** Stripe handles PCI compliance when using their hosted payment forms

## Testing

Use these test scenarios:

1. **Successful Payment:** Use card `4242 4242 4242 4242`
2. **Failed Payment:** Use card `4000 0000 0000 0002`
3. **Empty Cart:** Try to checkout with no items
4. **Invalid Form Data:** Submit incomplete customer information

## Production Deployment

Before going live:

1. Replace test API keys with live keys
2. Set up webhook endpoints
3. Configure proper error handling and logging
4. Test with real payment amounts (start small)
5. Ensure HTTPS is enabled
6. Review Stripe's go-live checklist

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing#cards

## Current Implementation Status

✅ **Completed:**
- Cart context and state management
- Product "Add to Cart" functionality
- Cart sidebar and dedicated cart page
- Checkout form structure
- Stripe configuration setup
- Payment Intent API route
- Order creation from payments
- Success page

🚧 **To Be Implemented:**
- Stripe Elements integration in checkout form
- Real-time payment processing
- Webhook handling for payment events
- Email confirmations
- Enhanced error handling
- Inventory management integration

## Next Steps

1. Integrate Stripe Elements into the checkout form
2. Implement real-time payment processing
3. Add email confirmations for orders
4. Set up webhook handling
5. Add comprehensive error handling
6. Test thoroughly with various scenarios
