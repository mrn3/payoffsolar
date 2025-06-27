'use client';

import React, { useState, useEffect } from 'react';
import { trackEvent, trackPurchase, trackAddToCart } from '@/components/GoogleAnalytics';
import { FaPlay, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function AnalyticsTestPage() {
  const [gaLoaded, setGaLoaded] = useState(false);
  const [trackingId, setTrackingId] = useState('');

  useEffect(() => {
    // Check if Google Analytics is loaded
    const checkGA = () => {
      if (typeof window !== 'undefined' && window.gtag) {
        setGaLoaded(true);
      }
    };

    // Check immediately
    checkGA();

    // Check again after a delay in case GA is still loading
    const timer = setTimeout(checkGA, 2000);

    // Fetch tracking ID
    fetchTrackingId();

    return () => clearTimeout(timer);
  }, []);

  const fetchTrackingId = async () => {
    try {
      const response = await fetch('/api/settings?public=true');
      if (response.ok) {
        const data = await response.json();
        const gaSetting = data.settings.find((setting: any) => setting.setting_key === 'google_analytics_id');
        if (gaSetting && gaSetting.setting_value) {
          setTrackingId(gaSetting.setting_value);
        }
      }
    } catch (error) {
      console.error('Error fetching tracking ID:', error);
    }
  };

  const testEvent = (eventName: string, action: () => void) => {
    try {
      action();
      toast.success(`${eventName} event sent successfully`);
    } catch (error) {
      console.error(`Error sending ${eventName} event:`, error);
      toast.error(`Failed to send ${eventName} event`);
    }
  };

  const testEvents = [
    {
      name: 'Custom Event',
      action: () => trackEvent('test_action', 'test_category', 'test_label', 1)
    },
    {
      name: 'Add to Cart',
      action: () => trackAddToCart('USD', 99.99, [{
        item_id: 'test-product',
        item_name: 'Test Product',
        category: 'Test Category',
        quantity: 1,
        price: 99.99
      }])
    },
    {
      name: 'Purchase',
      action: () => trackPurchase('test-transaction-123', 199.99, 'USD', [{
        item_id: 'test-product',
        item_name: 'Test Product',
        category: 'Test Category',
        quantity: 2,
        price: 99.99
      }])
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Google Analytics Test</h1>
        <p className="mt-2 text-sm text-gray-700">
          Test Google Analytics integration and event tracking.
        </p>
      </div>

      {/* Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Integration Status</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            {gaLoaded ? (
              <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
            ) : (
              <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-3" />
            )}
            <span className="text-sm">
              Google Analytics: {gaLoaded ? 'Loaded' : 'Not Loaded'}
            </span>
          </div>
          <div className="flex items-center">
            {trackingId ? (
              <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
            ) : (
              <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-3" />
            )}
            <span className="text-sm">
              Tracking ID: {trackingId || 'Not configured'}
            </span>
          </div>
        </div>

        {!gaLoaded && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              Google Analytics is not loaded. Make sure you have configured a valid Google Analytics tracking ID in the settings.
            </p>
          </div>
        )}
      </div>

      {/* Test Events */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Test Events</h2>
        <div className="space-y-3">
          {testEvents.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{test.name}</h3>
                <p className="text-xs text-gray-500">
                  Test {test.name.toLowerCase()} tracking
                </p>
              </div>
              <button
                onClick={() => testEvent(test.name, test.action)}
                disabled={!gaLoaded}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPlay className="mr-1 h-3 w-3" />
                Test
              </button>
            </div>
          ))}
        </div>

        {!gaLoaded && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Test buttons are disabled because Google Analytics is not loaded.
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Setup Instructions</h2>
        <div className="prose prose-sm text-gray-600">
          <ol>
            <li>Go to <a href="/dashboard/settings" className="text-green-600 hover:text-green-700">Settings</a> and configure your Google Analytics tracking ID</li>
            <li>The tracking ID should be in the format: G-XXXXXXXXXX</li>
            <li>Save the settings and refresh this page</li>
            <li>Once loaded, use the test buttons above to verify event tracking</li>
            <li>Check your Google Analytics dashboard to see the events</li>
          </ol>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Debug Information</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify({
              gaLoaded,
              trackingId,
              hasGtag: typeof window !== 'undefined' && !!window.gtag,
              hasDataLayer: typeof window !== 'undefined' && !!window.dataLayer,
              userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
