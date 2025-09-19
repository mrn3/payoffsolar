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

type TimePeriod = 'year' | 'month' | 'week' | 'day';

interface RevenueByStateData {
  year?: string;
  month?: string;
  week?: string;
  day?: string;
  state: string;
  revenue: number;
  count: number;
}

interface RevenueByStateChartProps {
  initialData?: RevenueByStateData[];
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
    if (timePeriod === 'year') {
      return period;
    } else if (timePeriod === 'month') {
      const parts = period.split('-');
      if (parts.length >= 2) {
        const [year, month] = parts;
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      }
      return period;
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Complete Orders - {formatPeriod(period, timePeriod)} - {state}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No complete orders found for {state} in {formatPeriod(period, timePeriod)}.
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
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.contact_city || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {order.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RevenueByStateChart({ initialData }: RevenueByStateChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');
  const [data, setData] = useState<RevenueByStateData[]>(initialData || []);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedPeriodState, setSelectedPeriodState] = useState<{ period: string; state: string } | null>(null);
  const [modalOrders, setModalOrders] = useState<OrderWithContact[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch data based on time period
  const fetchData = async (period: TimePeriod) => {
    setDataLoading(true);
    try {
      let endpoint = '/api/dashboard/revenue-by-state';
      let params = new URLSearchParams();
      params.append('timePeriod', period);

      switch (period) {
        case 'year':
          params.append('years', '5');
          break;
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
      } else {
        console.error('Failed to fetch revenue by state data');
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching revenue by state data:', error);
      setData([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Initial data fetch and when time period changes
  useEffect(() => {
    fetchData(timePeriod);
  }, [timePeriod]);

  const formatPeriodLabel = (period: string) => {
    if (timePeriod === 'year') {
      return period;
    } else if (timePeriod === 'month') {
      const parts = period.split('-');
      if (parts.length >= 2) {
        const [year, month] = parts;
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      return period;
    } else if (timePeriod === 'week') {
      const parts = period.split('-');
      return parts.length > 1 ? `W${parts[1]}` : period;
    } else {
      const date = new Date(period);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get unique periods and calculate state totals
  const periods = [...new Set(data.map(item =>
    item.year || item.month || item.week || item.day || ''
  ))].sort();

  // Calculate total revenue by state to determine top 4
  const stateTotals = data.reduce((acc, item) => {
    acc[item.state] = (acc[item.state] || 0) + item.revenue;
    return acc;
  }, {} as Record<string, number>);

  // Sort states by total revenue and get top 4
  const sortedStates = Object.entries(stateTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([state]) => state);

  const topStates = sortedStates.slice(0, 4);
  const otherStates = sortedStates.slice(4);

  // Process data to group "Others"
  // Start with only data for top states
  const processedData = data.filter(item => topStates.includes(item.state));

  // Add "Others" data points by combining all non-top states
  if (otherStates.length > 0) {
    periods.forEach(period => {
      const othersRevenue = otherStates.reduce((sum, state) => {
        const item = data.find(d =>
          (d.year === period || d.month === period || d.week === period || d.day === period) && d.state === state
        );
        return sum + (item ? item.revenue : 0);
      }, 0);

      const othersCount = otherStates.reduce((sum, state) => {
        const item = data.find(d =>
          (d.year === period || d.month === period || d.week === period || d.day === period) && d.state === state
        );
        return sum + (item ? item.count : 0);
      }, 0);

      if (othersRevenue > 0) {
        processedData.push({
          [timePeriod === 'year' ? 'year' : timePeriod === 'month' ? 'month' : timePeriod === 'week' ? 'week' : 'day']: period,
          state: 'Others',
          revenue: othersRevenue,
          count: othersCount
        } as any);
      }
    });
  }

  // Final states list (top 4 + Others if applicable)
  const displayStates = [...topStates];
  if (otherStates.length > 0) {
    displayStates.push('Others');
  }

  // Generate colors for each state
  const stateColors = [
    'rgba(34, 197, 94, 0.8)',   // Green
    'rgba(59, 130, 246, 0.8)',  // Blue
    'rgba(239, 68, 68, 0.8)',   // Red
    'rgba(245, 158, 11, 0.8)',  // Yellow
    'rgba(139, 92, 246, 0.8)',  // Purple - for Others
    'rgba(236, 72, 153, 0.8)',  // Pink
    'rgba(20, 184, 166, 0.8)',  // Teal
    'rgba(251, 146, 60, 0.8)',  // Orange
    'rgba(156, 163, 175, 0.8)', // Gray
    'rgba(16, 185, 129, 0.8)',  // Emerald
  ];

  // Prepare chart data
  const chartData = {
    labels: periods.map(formatPeriodLabel),
    datasets: displayStates.map((state, index) => ({
      label: state,
      data: periods.map(period => {
        const item = processedData.find(d =>
          (d.year === period || d.month === period || d.week === period || d.day === period) && d.state === state
        );
        return item ? item.revenue : 0;
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
            const monthIndex = context.dataIndex;
            const state = displayStates[datasetIndex];
            const month = months[monthIndex];
            const item = processedData.find(d => d.month === month && d.state === state);
            const revenue = formatCurrency(context.parsed.y);
            const count = item?.count || 0;
            return `${state}: ${revenue} (${count} orders)`;
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
          callback: function(value: any) {
            return formatCurrency(value);
          },
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
      {/* Time Period Filter Dropdown */}
      <div className="mb-4">
        <label htmlFor="time-period-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Time Period
        </label>
        <select
          id="time-period-filter"
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="year">By Year (Last 5 years)</option>
          <option value="month">By Month (Last 12 months)</option>
          <option value="week">By Week (Last 20 weeks)</option>
          <option value="day">By Day (Last 31 days)</option>
        </select>
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
