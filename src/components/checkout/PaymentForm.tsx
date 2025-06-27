'use client';

import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import { trackPurchase, formatGAItem } from '@/components/GoogleAnalytics';
import toast from 'react-hot-toast';
import { FaSpinner, FaLock } from 'react-icons/fa';

interface PaymentFormProps {
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  shippingMethod: string;
  onSuccess: (paymentIntentId: string) => void;
  onValidationError: (message: string) => void;
}

export default function PaymentForm({ customerInfo, shippingMethod, onSuccess, onValidationError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { state, getTotalPrice, getTotalDiscount, getTotalTax, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Check if Stripe is properly configured
  const isStripeConfigured = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== 'pk_test_your_stripe_publishable_key_here';

  const calculateShipping = () => {
    switch (shippingMethod) {
      case 'express':
        return 29.99;
      case 'overnight':
        return 49.99;
      default:
        return 9.99;
    }
  };

  const calculateTotal = () => {
    return getTotalPrice() + calculateShipping() + getTotalTax();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPaymentError(null);

    if (!stripe || !elements) {
      setPaymentError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('Card element not found. Please refresh the page.');
      return;
    }

    // Validate required customer info
    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName ||
        !customerInfo.address || !customerInfo.city || !customerInfo.state || !customerInfo.zip) {
      const message = 'Please fill in all required customer information before proceeding with payment.';
      setPaymentError(message);
      onValidationError(message);
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: state.items,
          shipping: {
            method: shippingMethod,
            cost: calculateShipping(),
          },
          customerInfo,
          affiliateCode: state.affiliateCode,
        }),
      });

      const { clientSecret, paymentIntentId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              postal_code: customerInfo.zip,
              country: 'US',
            },
          },
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // Track purchase in Google Analytics
        try {
          const items = state.items.map(item => formatGAItem({
            id: item.product_id,
            sku: item.product_sku,
            name: item.product_name,
            price: item.product_price,
            category_name: 'Product'
          }, item.quantity));

          trackPurchase(paymentIntent.id, 'USD', calculateTotal(), items);
        } catch (error) {
          console.error('Error tracking purchase:', error);
        }

        // Create order in database
        try {
          await fetch('/api/orders/public', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              customerInfo,
              items: state.items,
              shipping: {
                method: shippingMethod,
                cost: calculateShipping(),
              },
            }),
          });
        } catch (error) {
          console.error('Error creating order:', error);
          // Don't fail the payment for this error
        }

        toast.success('Payment successful! Redirecting...');
        clearCart();
        onSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'An unexpected error occurred');
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true, // We collect this separately
  };

  // Show configuration message if Stripe is not set up
  if (!isStripeConfigured) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center">
            <FaLock className="h-5 w-5 text-yellow-400 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">Stripe Configuration Required</h3>
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            <p>To enable payments, please configure your Stripe API keys:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Sign up for a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">stripe.com</a></li>
              <li>Get your test API keys from the Stripe dashboard</li>
              <li>Update your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file with:</li>
            </ol>
            <pre className="mt-2 bg-yellow-100 p-2 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here`}
            </pre>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
            <FaLock className="h-4 w-4 mr-2" />
            Payment form will appear here once configured
          </div>
        </div>

        <button
          type="button"
          disabled
          className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-md font-medium cursor-not-allowed"
        >
          Complete Order - Configure Stripe First
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-md p-3 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{paymentError}</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
          <FaLock className="h-4 w-4 mr-2" />
          Your payment information is secure and encrypted
        </div>
        <p className="text-xs text-gray-500 text-center">
          Powered by Stripe. We never store your card details.
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <FaSpinner className="animate-spin h-4 w-4 mr-2" />
            Processing Payment...
          </>
        ) : (
          `Complete Order - $${calculateTotal().toFixed(2)}`
        )}
      </button>
    </form>
  );
}
