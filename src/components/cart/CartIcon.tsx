'use client';

import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '@/contexts/CartContext';

export default function CartIcon() {
  const { getTotalItems, toggleCart } = useCart();
  const itemCount = getTotalItems();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <FaShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
