'use client';

import React, { useState } from 'react';
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

interface RevenueByStateData {
  month: string;
  state: string;
  revenue: number;
  count: number;
}

interface RevenueByStateChartProps {
  data: RevenueByStateData[];
}

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  state: string;
  orders: OrderWithContact[];
  loading: boolean;
}

function OrdersModal({ isOpen, onClose, month, state, orders, loading }: OrdersModalProps) {
  if (!isOpen) return null;

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
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
            Complete Orders - {formatMonth(month)} - {state}
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
              No complete orders found for {state} in {formatMonth(month)}.
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

export default function RevenueByStateChart({ data }: RevenueByStateChartProps) {
  const [selectedMonthState, setSelectedMonthState] = useState<{ month: string; state: string } | null>(null);
  const [modalOrders, setModalOrders] = useState<OrderWithContact[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get unique months and states
  const months = [...new Set(data.map(item => item.month))].sort();
  const states = [...new Set(data.map(item => item.state))].sort();

  // Generate colors for each state
  const stateColors = [
    'rgba(34, 197, 94, 0.8)',   // Green
    'rgba(59, 130, 246, 0.8)',  // Blue
    'rgba(239, 68, 68, 0.8)',   // Red
    'rgba(245, 158, 11, 0.8)',  // Yellow
    'rgba(139, 92, 246, 0.8)',  // Purple
    'rgba(236, 72, 153, 0.8)',  // Pink
    'rgba(20, 184, 166, 0.8)',  // Teal
    'rgba(251, 146, 60, 0.8)',  // Orange
    'rgba(156, 163, 175, 0.8)', // Gray
    'rgba(16, 185, 129, 0.8)',  // Emerald
  ];

  // Prepare chart data
  const chartData = {
    labels: months.map(formatMonth),
    datasets: states.map((state, index) => ({
      label: state,
      data: months.map(month => {
        const item = data.find(d => d.month === month && d.state === state);
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
            const state = states[datasetIndex];
            const month = months[monthIndex];
            const item = data.find(d => d.month === month && d.state === state);
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
        const month = months[elementIndex];
        const state = states[datasetIndex];
        
        if (month && state) {
          setSelectedMonthState({ month, state });
          setModalLoading(true);
          
          try {
            const response = await fetch(`/api/orders/by-month-and-state?month=${month}&state=${encodeURIComponent(state)}`);
            if (response.ok) {
              const orders = await response.json();
              setModalOrders(orders);
            } else {
              console.error('Failed to fetch orders for month and state:', month, state);
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
    setSelectedMonthState(null);
    setModalOrders([]);
  };

  return (
    <>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      
      <OrdersModal
        isOpen={!!selectedMonthState}
        onClose={closeModal}
        month={selectedMonthState?.month || ''}
        state={selectedMonthState?.state || ''}
        orders={modalOrders}
        loading={modalLoading}
      />
    </>
  );
}
