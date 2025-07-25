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
  ChartEvent,
  ActiveElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { OrderWithContact } from '@/lib/types';
import { FaTimes } from 'react-icons/fa';

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
  categories: CostCategory[];
}

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  category: string;
  orders: OrderWithContact[];
  loading: boolean;
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

function OrdersModal({ isOpen, onClose, month, category, orders, loading }: OrdersModalProps) {
  if (!isOpen) return null;

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Orders for {formatMonth(month)} - {category}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders found for this month and category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.contact_name || 'Unknown Contact'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'Complete' ? 'bg-green-100 text-green-800' :
                          order.status === 'Paid' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'Proposed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(parseFloat(order.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

export default function CostBreakdownChart({ data, categories }: CostBreakdownChartProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [filteredData, setFilteredData] = useState<CostBreakdownData[]>(data);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modalOrders, setModalOrders] = useState<OrderWithContact[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

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
    onClick: async (event: ChartEvent, elements: ActiveElement[]) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const datasetIndex = elements[0].datasetIndex;
        const month = months[elementIndex];
        const category = categoryNames[datasetIndex];

        if (month && category) {
          setSelectedMonth(month);
          setSelectedCategory(category);
          setModalLoading(true);

          try {
            const response = await fetch(`/api/orders/by-month-category?month=${month}&category=${encodeURIComponent(category)}`);
            if (response.ok) {
              const orders = await response.json();
              setModalOrders(orders);
            } else {
              console.error('Failed to fetch orders for month and category:', month, category);
              setModalOrders([]);
            }
          } catch (error) {
            console.error('Error fetching orders:', error);
            setModalOrders([]);
          } finally {
            setModalLoading(false);
          }
        }
      }
    },
  };

  const closeModal = () => {
    setSelectedMonth(null);
    setSelectedCategory(null);
    setModalOrders([]);
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

      <OrdersModal
        isOpen={!!(selectedMonth && selectedCategory)}
        onClose={closeModal}
        month={selectedMonth || ''}
        category={selectedCategory || ''}
        orders={modalOrders}
        loading={modalLoading}
      />
    </div>
  );
}
