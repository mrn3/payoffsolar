'use client';

import React from 'react';

export default function TestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Page</h1>
      <p className="text-gray-600 mb-4">
        If you can see this page, React is working correctly.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <p className="text-green-800">✅ React components are rendering</p>
        <p className="text-green-800">✅ Tailwind CSS is working</p>
        <p className="text-green-800">✅ Next.js routing is working</p>
      </div>
      <div className="mt-4">
        <button 
          onClick={() => alert('JavaScript is working!')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test JavaScript
        </button>
      </div>
    </div>
  );
}
