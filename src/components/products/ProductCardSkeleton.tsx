import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200"></div>
      
      {/* Content skeleton */}
      <div className="p-4">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        
        {/* Category skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        
        {/* Price and SKU skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
