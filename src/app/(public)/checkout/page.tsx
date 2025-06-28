'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { trackBeginCheckout, formatGAItem } from '@/components/GoogleAnalytics';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaImage, FaLock, FaTag } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { STRIPE_CONFIG } from '@/lib/stripe';
import PaymentForm from '@/components/checkout/PaymentForm';
// Removed direct import of ShippingService to avoid client-side Node.js module issues

interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  shippingMethod: string;
  isLocalPickup?: boolean;
}

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

export default function CheckoutPage() {
  const { state, getTotalPrice, getTotalDiscount, getTotalTax } = useCart();
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    shippingMethod: 'standard',
  });

  const [shippingMethods, setShippingMethods] = useState<Array<{
    name: string;
    cost: number;
    estimatedDays?: number;
  }>>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Track begin checkout event when page loads
  useEffect(() => {
    if (state.items.length > 0) {
      try {
        const items = state.items.map(item => formatGAItem({
          id: item.product_id,
          sku: item.product_sku,
          name: item.product_name,
          price: item.product_price,
          category_name: 'Product'
        }, item.quantity));

        trackBeginCheckout('USD', getTotalPrice(), items);
      } catch (error) {
        console.error('Error tracking begin checkout:', error);
      }
    }
  }, [state.items, getTotalPrice]);

  // Calculate shipping when address changes
  useEffect(() => {
    const calculateShippingCosts = async () => {
      if (state.items.length === 0) {
        setShippingMethods([]);
        setShippingCost(0);
        return;
      }

      // Check if we have any products with local pickup options
      const hasLocalPickupOptions = state.items.some(item => {
        // This would need to be enhanced to check actual product shipping methods
        // For now, we'll always try to calculate shipping
        return false;
      });

      // If no address is provided and we don't have local pickup, don't calculate
      if (!hasLocalPickupOptions && (!formData.address || !formData.city || !formData.state || !formData.zip)) {
        setShippingMethods([]);
        setShippingCost(0);
        return;
      }

      setLoadingShipping(true);
      try {
        const cartItems = state.items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity
        }));

        const shippingAddress = formData.address && formData.city && formData.state && formData.zip ? {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        } : null;

        // Call the cart shipping calculation API
        const response = await fetch('/api/shipping/calculate-cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cartItems,
            shippingAddress: shippingAddress
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setShippingMethods(result.methods);

        // Set the cost of the selected method or the cheapest one
        const selectedMethod = result.methods.find(m => m.name.toLowerCase().includes(formData.shippingMethod));
        const defaultMethod = selectedMethod || result.methods[0];
        setShippingCost(defaultMethod?.cost || 0);

      } catch (error) {
        console.error('Error calculating shipping:', error);
        // Fall back to default shipping calculation
        setShippingMethods([
          { name: 'Free Shipping', cost: 0, estimatedDays: 7 },
          { name: 'Standard Shipping', cost: 9.99, estimatedDays: 5 },
          { name: 'Express Shipping', cost: 29.99, estimatedDays: 2 },
          { name: 'Overnight Shipping', cost: 49.99, estimatedDays: 1 }
        ]);
        setShippingCost(0); // Default to free shipping
      } finally {
        setLoadingShipping(false);
      }
    };

    // Debounce the calculation
    const timeoutId = setTimeout(calculateShippingCosts, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.address, formData.city, formData.state, formData.zip, formData.shippingMethod, state.items]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const calculateShipping = () => {
    return shippingCost;
  };

  const calculateTotal = () => {
    return getTotalPrice() + calculateShipping() + getTotalTax();
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) errors.email = 'Email is required';
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';

    // Only require address fields if not local pickup
    const selectedMethod = shippingMethods.find(method =>
      method.name.toLowerCase().replace(/\s+/g, '-') === formData.shippingMethod
    );
    const isLocalPickup = selectedMethod?.name.toLowerCase().includes('pickup');

    if (!isLocalPickup) {
      if (!formData.address) errors.address = 'Address is required';
      if (!formData.city) errors.city = 'City is required';
      if (!formData.state) errors.state = 'State is required';
      if (!formData.zip) errors.zip = 'ZIP code is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update shipping cost when method changes
    if (name === 'shippingMethod') {
      const selectedMethod = shippingMethods.find(method =>
        method.name.toLowerCase().replace(/\s+/g, '-') === value
      );
      if (selectedMethod) {
        setShippingCost(selectedMethod.cost);
      }
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleValidationError = (message: string) => {
    // Scroll to top to show validation errors
    window.scrollTo({ top: 0, behavior: 'smooth' });
    validateForm(); // This will set the form errors for display
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    // Redirect to success page
    window.location.href = `/checkout/success?payment_intent=${paymentIntentId}`;
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">
              You need to add items to your cart before you can checkout.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors font-medium"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Cart', href: '/cart' },
            { label: 'Checkout' }
          ]}
          className="mb-6"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <FaLock className="h-5 w-5 text-green-500 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Secure Checkout</h1>
            </div>

            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        formErrors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        formErrors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        formErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.address && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          formErrors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.city && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          formErrors.state ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.state && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.state}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        id="zip"
                        name="zip"
                        required
                        value={formData.zip}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          formErrors.zip ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.zip && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.zip}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Method</h2>
                {loadingShipping ? (
                  <div className="text-gray-500 text-center py-4">
                    Calculating shipping costs...
                  </div>
                ) : shippingMethods.length > 0 ? (
                  <div className="space-y-3">
                    {shippingMethods.map((method, index) => {
                      const methodValue = method.name.toLowerCase().replace(/\s+/g, '-');
                      return (
                        <label key={index} className="flex items-center">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={methodValue}
                            checked={formData.shippingMethod === methodValue || (index === 0 && !shippingMethods.some(m => m.name.toLowerCase().replace(/\s+/g, '-') === formData.shippingMethod))}
                            onChange={handleInputChange}
                            className="mr-3"
                          />
                          <span className="flex-1">
                            <span className="text-gray-900">{method.name}</span>
                            {method.estimatedDays && (
                              <span className="text-gray-700 text-sm ml-1">
                                ({method.estimatedDays} business day{method.estimatedDays !== 1 ? 's' : ''})
                              </span>
                            )}
                          </span>
                          <span className="font-medium text-gray-900">{formatPrice(method.cost)}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    Enter your shipping address to see available shipping options.
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    customerInfo={formData}
                    shippingMethod={formData.shippingMethod}
                    shippingCost={shippingCost}
                    onSuccess={handlePaymentSuccess}
                    onValidationError={handleValidationError}
                  />
                </Elements>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {state.items.map((item) => (
                <div key={item.product_id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                    {item.product_image_url ? (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaImage className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    {state.affiliateCode ? (
                      <div>
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice(item.product_price * item.quantity)}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          {formatPrice(state.affiliateCode.discount_type === 'percentage'
                            ? (item.product_price - (item.product_price * state.affiliateCode.discount_value / 100)) * item.quantity
                            : Math.max(0, item.product_price - state.affiliateCode.discount_value) * item.quantity
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(item.product_price * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              {state.affiliateCode && getTotalDiscount() > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <FaTag className="h-3 w-3" />
                    Discount ({state.affiliateCode.code})
                  </span>
                  <span>-{formatPrice(getTotalDiscount())}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatPrice(calculateShipping())}</span>
              </div>
              {getTotalTax() > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(getTotalTax())}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
