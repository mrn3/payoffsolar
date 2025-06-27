'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import Breadcrumb from '@/components/ui/Breadcrumb';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaImage, FaLock, FaTag } from 'react-icons/fa';

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
}

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const calculateShipping = () => {
    // Simple shipping calculation - in a real app this would be more complex
    switch (formData.shippingMethod) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Stripe payment processing
    console.log('Checkout form submitted:', formData);
    toast('Checkout functionality will be implemented with Stripe integration', {
      icon: '🚧',
      duration: 5000,
    });
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

            <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard"
                      checked={formData.shippingMethod === 'standard'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="flex-1">Standard Shipping (5-7 business days)</span>
                    <span className="font-medium">{formatPrice(9.99)}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="express"
                      checked={formData.shippingMethod === 'express'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="flex-1">Express Shipping (2-3 business days)</span>
                    <span className="font-medium">{formatPrice(29.99)}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="overnight"
                      checked={formData.shippingMethod === 'overnight'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="flex-1">Overnight Shipping (1 business day)</span>
                    <span className="font-medium">{formatPrice(49.99)}</span>
                  </label>
                </div>
              </div>

              {/* Payment Section Placeholder */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FaLock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Stripe payment form will be integrated here</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors font-medium"
              >
                Complete Order
              </button>
            </form>
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
