'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, AffiliateCode } from '@/lib/types';
import { trackAddToCart, trackRemoveFromCart, formatGAItem } from '@/components/GoogleAnalytics';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  affiliateCode?: AffiliateCode;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string } // product_id
  | { type: 'UPDATE_QUANTITY'; payload: { product_id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'APPLY_AFFILIATE_CODE'; payload: AffiliateCode }
  | { type: 'REMOVE_AFFILIATE_CODE' }
  | { type: 'LOAD_AFFILIATE_CODE'; payload: AffiliateCode };

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getDiscountedPrice: (price: number) => number;
  getTotalDiscount: () => number;
  getTotalTax: () => number;
  applyAffiliateCode: (affiliateCode: AffiliateCode) => void;
  removeAffiliateCode: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.product_id === action.payload.product_id
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + action.payload.quantity
        };
        return { ...state, items: updatedItems };
      } else {
        // Add new item
        return { ...state, items: [...state.items, action.payload] };
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.product_id !== action.payload)
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.product_id !== action.payload.product_id)
        };
      }

      const updatedItems = state.items.map(item =>
        item.product_id === action.payload.product_id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return { ...state, items: updatedItems };
    }

    case 'CLEAR_CART':
      return { ...state, items: [], affiliateCode: undefined };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'LOAD_CART':
      return { ...state, items: action.payload };

    case 'APPLY_AFFILIATE_CODE':
      return { ...state, affiliateCode: action.payload };

    case 'REMOVE_AFFILIATE_CODE':
      return { ...state, affiliateCode: undefined };

    case 'LOAD_AFFILIATE_CODE':
      return { ...state, affiliateCode: action.payload };

    default:
      return state;
  }
};

const initialState: CartState = {
  items: [],
  isOpen: false,
  affiliateCode: undefined,
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('payoffsolar-cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        // Ensure all cart items have the product_tax_percentage field (for backward compatibility)
        const migratedCartItems = cartItems.map((item: any) => ({
          ...item,
          product_tax_percentage: item.product_tax_percentage ?? 0
        }));
        dispatch({ type: 'LOAD_CART', payload: migratedCartItems });
      } catch (_error) {
        console.error('Error loading cart from localStorage:', _error);
      }
    }

    const savedAffiliateCode = localStorage.getItem('payoffsolar-affiliate-code');
    if (savedAffiliateCode) {
      try {
        const affiliateCode = JSON.parse(savedAffiliateCode);
        dispatch({ type: 'LOAD_AFFILIATE_CODE', payload: affiliateCode });
      } catch (_error) {
        console.error('Error loading affiliate code from localStorage:', _error);
      }
    }
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('payoffsolar-cart', JSON.stringify(state.items));
  }, [state.items]);

  // Save affiliate code to localStorage whenever it changes
  useEffect(() => {
    if (state.affiliateCode) {
      localStorage.setItem('payoffsolar-affiliate-code', JSON.stringify(state.affiliateCode));
    } else {
      localStorage.removeItem('payoffsolar-affiliate-code');
    }
  }, [state.affiliateCode]);

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { ...item, quantity }
    });

    // Track add to cart event
    try {
      const gaItem = formatGAItem({
        id: item.product_id,
        sku: item.product_sku,
        name: item.product_name,
        price: item.product_price,
        category_name: 'Product'
      }, quantity);

      trackAddToCart('USD', item.product_price * quantity, [gaItem]);
    } catch (error) {
      console.error('Error tracking add to cart:', error);
    }
  };

  const removeItem = (productId: string) => {
    // Find the item being removed for tracking
    const itemToRemove = state.items.find(item => item.product_id === productId);

    dispatch({ type: 'REMOVE_ITEM', payload: productId });

    // Track remove from cart event
    if (itemToRemove) {
      try {
        const gaItem = formatGAItem({
          id: itemToRemove.product_id,
          sku: itemToRemove.product_sku,
          name: itemToRemove.product_name,
          price: itemToRemove.product_price,
          category_name: 'Product'
        }, itemToRemove.quantity);

        trackRemoveFromCart('USD', itemToRemove.product_price * itemToRemove.quantity, [gaItem]);
      } catch (error) {
        console.error('Error tracking remove from cart:', error);
      }
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id: productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => {
      const discountedPrice = getDiscountedPrice(item.product_price);
      return total + (discountedPrice * item.quantity);
    }, 0);
  };

  const getDiscountedPrice = (price: number) => {
    if (!state.affiliateCode) return price;

    if (state.affiliateCode.discount_type === 'percentage') {
      const discount = (price * state.affiliateCode.discount_value) / 100;
      return Math.max(0, price - discount);
    } else {
      return Math.max(0, price - state.affiliateCode.discount_value);
    }
  };

  const getTotalDiscount = () => {
    if (!state.affiliateCode) return 0;

    return state.items.reduce((total, item) => {
      const originalPrice = item.product_price * item.quantity;
      const discountedPrice = getDiscountedPrice(item.product_price) * item.quantity;
      return total + (originalPrice - discountedPrice);
    }, 0);
  };

  const getTotalTax = () => {
    return state.items.reduce((total, item) => {
      if (item.product_tax_percentage > 0) {
        const itemPrice = getDiscountedPrice(item.product_price) * item.quantity;
        const itemTax = (itemPrice * item.product_tax_percentage) / 100;
        return total + itemTax;
      }
      return total;
    }, 0);
  };

  const applyAffiliateCode = (affiliateCode: AffiliateCode) => {
    dispatch({ type: 'APPLY_AFFILIATE_CODE', payload: affiliateCode });
  };

  const removeAffiliateCode = () => {
    dispatch({ type: 'REMOVE_AFFILIATE_CODE' });
  };

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    getTotalItems,
    getTotalPrice,
    getDiscountedPrice,
    getTotalDiscount,
    getTotalTax,
    applyAffiliateCode,
    removeAffiliateCode,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
