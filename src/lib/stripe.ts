import Stripe from 'stripe';

// Initialize Stripe with secret key
// Handle missing or invalid keys gracefully during build time
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let stripe: Stripe;

if (!stripeSecretKey || stripeSecretKey === 'your-stripe-secret-key') {
  // During build time or when keys are not properly configured,
  // create a dummy Stripe instance that will throw meaningful errors
  stripe = {
    paymentIntents: {
      retrieve: () => {
        throw new Error('Stripe is not properly configured. Please set STRIPE_SECRET_KEY environment variable.');
      },
      create: () => {
        throw new Error('Stripe is not properly configured. Please set STRIPE_SECRET_KEY environment variable.');
      },
    },
  } as any;
} else {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-05-28.basil',
  });
}

export default stripe;

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  currency: 'usd',
  country: 'US',
};

// Helper function to format amount for Stripe (convert dollars to cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// Helper function to format amount from Stripe (convert cents to dollars)
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};
