'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CostBreakdownData {
  month: string;
  category_name: string;
  total_amount: number;
}

interface CostCategory {
  id: string;
  name: string;
}

interface CostBreakdownChartProps {
  data: CostBreakdownData[];
}

// Color palette for different cost categories
const categoryColors = [
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#06B6D4', // cyan-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5A2B', // brown-500
  '#6B7280', // gray-500
];

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [filteredData, setFilteredData] = useState<CostBreakdownData[]>(data);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/cost-categories');
        if (response.ok) {
          const result = await response.json();
          setCategories(result.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Filter data when category selection changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => {
        const category = categories.find(cat => cat.name === item.category_name);
        return category?.id === selectedCategoryId;
      });
      setFilteredData(filtered);
    }
  }, [selectedCategoryId, data, categories]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No cost breakdown data available
      </div>
    );
  }

  // Get unique months and categories from filtered data
  const months = [...new Set(filteredData.map(item => item.month))].sort();
  const categoryNames = [...new Set(filteredData.map(item => item.category_name))].sort();

  // Prepare chart data
  const chartData = {
    labels: months.map(formatMonth),
    datasets: categoryNames.map((category, index) => ({
      label: category,
      data: months.map(month => {
        const item = filteredData.find(d => d.month === month && d.category_name === category);
        return item ? Number(item.total_amount) : 0;
      }),
      backgroundColor: categoryColors[index % categoryColors.length],
      borderColor: categoryColors[index % categoryColors.length],
      borderWidth: 1,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = formatCurrency(context.parsed.y);
            return `${context.dataset.label}: ${value}`;
          },
          footer: function(tooltipItems: any[]) {
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            return `Total: ${formatCurrency(total)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div>
      {/* Category Filter Dropdown */}
      <div className="mb-4">
        <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Category
        </label>
        <select
          id="category-filter"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
