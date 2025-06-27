'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { FaTag, FaSpinner, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function AffiliateCodeInput() {
  const { state, applyAffiliateCode, removeAffiliateCode } = useCart();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/affiliate/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (data.valid) {
        applyAffiliateCode(data.affiliateCode);
        setCode('');
        toast.success(`Affiliate code "${data.affiliateCode.code}" applied! ${
          data.affiliateCode.discount_type === 'percentage' 
            ? `${data.affiliateCode.discount_value}% off` 
            : `$${data.affiliateCode.discount_value} off`
        }`);
      } else {
        toast.error(`Invalid affiliate code: ${data.reason}`);
      }
    } catch (error) {
      console.error('Error validating affiliate code:', error);
      toast.error('Failed to validate affiliate code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    removeAffiliateCode();
    toast.success('Affiliate code removed');
  };

  if (state.affiliateCode) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaTag className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Affiliate code "{state.affiliateCode.code}" applied
            </span>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
              {state.affiliateCode.discount_type === 'percentage' 
                ? `${state.affiliateCode.discount_value}% off` 
                : `$${state.affiliateCode.discount_value} off`
              }
            </span>
          </div>
          <button
            onClick={handleRemove}
            className="text-green-600 hover:text-green-800 transition-colors"
            title="Remove affiliate code"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="affiliate-code" className="block text-sm font-medium text-gray-700">
        Affiliate Code
      </label>
      <div className="flex gap-2">
        <input
          id="affiliate-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter affiliate code"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <FaSpinner className="h-4 w-4 animate-spin" />
          ) : (
            <FaTag className="h-4 w-4" />
          )}
          Apply
        </button>
      </div>
    </form>
  );
}
