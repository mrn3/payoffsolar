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
import { OrderWithContact, ProductCategory } from '@/lib/types';
import { FaTimes } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type TimePeriod = 'month' | 'week' | 'day';

interface UnitsSoldData {
  month?: string;
  week?: string;
  day?: string;
  state: string;
  units_sold: number;
  order_count: number;
}

interface UnitsSoldChartProps {
  categories: ProductCategory[];
}

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
  state: string;
  timePeriod: TimePeriod;
  orders: OrderWithContact[];
  loading: boolean;
}

function OrdersModal({ isOpen, onClose, period, state, timePeriod, orders, loading }: OrdersModalProps) {
  if (!isOpen) return null;

  const formatPeriod = (period: string, timePeriod: TimePeriod) => {
    if (timePeriod === 'month') {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } else if (timePeriod === 'week') {
      return `Week ${period}`;
    } else {
      const date = new Date(period);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Orders for {formatPeriod(period, timePeriod)} - {state}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders found for this period and state.</p>
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
                        Units Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.contact_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.units_sold || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'complete' ? 'bg-green-100 text-green-800' :
                            order.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnitsSoldChart({ categories }: UnitsSoldChartProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [data, setData] = useState<UnitsSoldData[]>([]);
  const [filteredData, setFilteredData] = useState<UnitsSoldData[]>([]);
  const [selectedPeriodState, setSelectedPeriodState] = useState<{ period: string; state: string } | null>(null);
  const [modalOrders, setModalOrders] = useState<OrderWithContact[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch data based on time period and category
  const fetchData = async (period: TimePeriod, categoryId?: string) => {
    setDataLoading(true);
    try {
      let endpoint = '/api/dashboard/units-sold-by-state';
      let params = new URLSearchParams();
      params.append('timePeriod', period);

      if (categoryId) {
        params.append('categoryId', categoryId);
      }

      switch (period) {
        case 'month':
          params.append('months', '12');
          break;
        case 'week':
          params.append('weeks', '20');
          break;
        case 'day':
          params.append('days', '31');
          break;
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (response.ok) {
        const newData = await response.json();
        setData(newData);
        setFilteredData(newData);
      } else {
        console.error('Failed to fetch units sold data');
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error fetching units sold data:', error);
      setData([]);
      setFilteredData([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData(timePeriod, selectedCategoryId || undefined);
  }, [timePeriod, selectedCategoryId]);

  // Color palette for states
  const stateColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#8B5A2B', '#6B7280', '#DC2626'
  ];

  // Get unique periods and calculate state totals
  const periods = [...new Set(filteredData.map(item =>
    item.month || item.week || item.day || ''
  ))].sort();

  // Calculate total units sold by state to determine top 4
  const stateTotals = filteredData.reduce((acc, item) => {
    acc[item.state] = (acc[item.state] || 0) + item.units_sold;
    return acc;
  }, {} as Record<string, number>);

  // Sort states by total units sold and get top 4
  const sortedStates = Object.entries(stateTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([state]) => state);

  const topStates = sortedStates.slice(0, 4);
  const otherStates = sortedStates.slice(4);

  // Process data to group "Others"
  // Start with only data for top states
  const processedData = filteredData.filter(item => topStates.includes(item.state));

  // Add "Others" data points by combining all non-top states
  if (otherStates.length > 0) {
    periods.forEach(period => {
      const othersUnits = otherStates.reduce((sum, state) => {
        const item = filteredData.find(d =>
          (d.month === period || d.week === period || d.day === period) && d.state === state
        );
        return sum + (item ? item.units_sold : 0);
      }, 0);

      const othersOrderCount = otherStates.reduce((sum, state) => {
        const item = filteredData.find(d =>
          (d.month === period || d.week === period || d.day === period) && d.state === state
        );
        return sum + (item ? item.order_count : 0);
      }, 0);

      if (othersUnits > 0) {
        processedData.push({
          [timePeriod === 'month' ? 'month' : timePeriod === 'week' ? 'week' : 'day']: period,
          state: 'Others',
          units_sold: othersUnits,
          order_count: othersOrderCount
        } as any);
      }
    });
  }

  // Final states list (top 4 + Others if applicable)
  const displayStates = [...topStates];
  if (otherStates.length > 0) {
    displayStates.push('Others');
  }

  const formatPeriodLabel = (period: string) => {
    if (timePeriod === 'month') {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else if (timePeriod === 'week') {
      return `W${period.split('-')[1]}`;
    } else {
      const date = new Date(period);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Prepare chart data
  const chartData = {
    labels: periods.map(formatPeriodLabel),
    datasets: displayStates.map((state, index) => ({
      label: state,
      data: periods.map(period => {
        const item = processedData.find(d =>
          (d.month === period || d.week === period || d.day === period) && d.state === state
        );
        return item ? item.units_sold : 0;
      }),
      backgroundColor: stateColors[index % stateColors.length],
      borderColor: stateColors[index % stateColors.length],
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
            const datasetIndex = context.datasetIndex;
            const periodIndex = context.dataIndex;
            const state = displayStates[datasetIndex];
            const period = periods[periodIndex];
            const item = processedData.find(d =>
              (d.month === period || d.week === period || d.day === period) && d.state === state
            );
            const units = context.parsed.y;
            const orderCount = item?.order_count || 0;
            return `${state}: ${units} units (${orderCount} orders)`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    onClick: async (event: ChartEvent, elements: ActiveElement[]) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const datasetIndex = elements[0].datasetIndex;
        const period = periods[elementIndex];
        const state = displayStates[datasetIndex];
        
        if (period && state) {
          setSelectedPeriodState({ period, state });
          setModalLoading(true);
          
          try {
            // For "Others" group, we need to fetch orders for all other states
            if (state === 'Others') {
              // Fetch orders for all other states and combine them
              const allOrders = [];
              for (const otherState of otherStates) {
                let params = new URLSearchParams();
                params.append('timePeriod', timePeriod);
                params.append('period', period);
                params.append('state', otherState);

                if (selectedCategoryId) {
                  params.append('categoryId', selectedCategoryId);
                }

                const response = await fetch(`/api/orders/by-period-and-state?${params.toString()}`);
                if (response.ok) {
                  const orders = await response.json();
                  allOrders.push(...orders);
                }
              }
              setModalOrders(allOrders);
            } else {
              let params = new URLSearchParams();
              params.append('timePeriod', timePeriod);
              params.append('period', period);
              params.append('state', state);

              if (selectedCategoryId) {
                params.append('categoryId', selectedCategoryId);
              }

              const response = await fetch(`/api/orders/by-period-and-state?${params.toString()}`);
              if (response.ok) {
                const orders = await response.json();
                setModalOrders(orders);
              } else {
                console.error('Failed to fetch orders for period and state:', period, state);
                setModalOrders([]);
              }
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
    setSelectedPeriodState(null);
    setModalOrders([]);
  };

  return (
    <div>
      {/* Time Period and Category Filter Dropdowns */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label htmlFor="time-period-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Time Period
          </label>
          <select
            id="time-period-filter"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="month">By Month (Last 12 months)</option>
            <option value="week">By Week (Last 20 weeks)</option>
            <option value="day">By Day (Last 31 days)</option>
          </select>
        </div>

        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Product Category
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
      </div>

      {/* Chart */}
      <div className="h-64">
        {dataLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
      
      <OrdersModal
        isOpen={!!selectedPeriodState}
        onClose={closeModal}
        period={selectedPeriodState?.period || ''}
        state={selectedPeriodState?.state || ''}
        timePeriod={timePeriod}
        orders={modalOrders}
        loading={modalLoading}
      />
    </div>
  );
}
