'use client';

import React, { useState, useEffect } from 'react';
import { FaFilter, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import StateSelect from '@/components/ui/StateSelect';

export interface OrderFilters {
  contactName: string;
  city: string;
  state: string;
  status: string;
  minTotal: string;
  maxTotal: string;
  startDate: string;
  endDate: string;
}

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClearFilters: () => void;
}

const ORDER_STATUSES = [
  'Cancelled',
  'Complete', 
  'Paid',
  'Proposed',
  'Scheduled'
];

export default function OrderFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: OrderFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Check if any filters are active
  useEffect(() => {
    const active = Object.values(filters).some(value => value !== '');
    setHasActiveFilters(active);
  }, [filters]);

  const handleFilterChange = (field: keyof OrderFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleClearFilters = () => {
    onClearFilters();
    setIsExpanded(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaFilter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <FaTimes className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <FaChevronUp className="h-4 w-4" />
              ) : (
                <FaChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Row 1: Contact Name and Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                id="contactName"
                value={filters.contactName}
                onChange={(e) => handleFilterChange('contactName', e.target.value)}
                placeholder="Search by contact name..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Search by city..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <StateSelect
                name="state"
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm"
              />
            </div>
          </div>

          {/* Row 2: Status and Total Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Order Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm"
              >
                <option value="">All statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="minTotal" className="block text-sm font-medium text-gray-700 mb-1">
                Min Total ($)
              </label>
              <input
                type="number"
                id="minTotal"
                value={filters.minTotal}
                onChange={(e) => handleFilterChange('minTotal', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm"
              />
            </div>
            <div>
              <label htmlFor="maxTotal" className="block text-sm font-medium text-gray-700 mb-1">
                Max Total ($)
              </label>
              <input
                type="number"
                id="maxTotal"
                value={filters.maxTotal}
                onChange={(e) => handleFilterChange('maxTotal', e.target.value)}
                placeholder="999999.99"
                min="0"
                step="0.01"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm"
              />
            </div>
          </div>

          {/* Row 3: Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
