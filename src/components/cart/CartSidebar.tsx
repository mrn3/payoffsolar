'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import {FaImage, FaMinus, FaPlus, FaTimes, FaTrash, FaTag} from 'react-icons/fa';
import AffiliateCodeInput from './AffiliateCodeInput';

export default function CartSidebar() {
  const { state, removeItem, updateQuantity, closeCart, getTotalPrice, getTotalDiscount, getDiscountedPrice } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!state.isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close cart"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {state.items.length === 0 ? (
            <div className="text-center py-8">
              <FaImage className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="inline-block bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => (
                <div key={item.product_id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                    {item.product_image_url ? (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaImage className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.product_name}
                    </h3>
                    <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                    <div>
                      {state.affiliateCode ? (
                        <div>
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice(item.product_price)}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            {formatPrice(getDiscountedPrice(item.product_price))}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(item.product_price)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <FaMinus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <FaPlus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Remove item"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Affiliate Code Input */}
            <AffiliateCodeInput />

            {/* Discount Display */}
            {state.affiliateCode && getTotalDiscount() > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <FaTag className="h-3 w-3" />
                  Discount ({state.affiliateCode.code})
                </span>
                <span>-{formatPrice(getTotalDiscount())}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
              <span>Total:</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full bg-gray-100 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-center block font-medium"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-center block font-medium"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
