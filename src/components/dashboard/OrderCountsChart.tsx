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
import { OrderWithContact } from '@/lib/models';
import { FaTimes } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OrderCountData {
  month: string;
  status: string;
  count: number;
}

interface OrderCountsChartProps {
  data: OrderCountData[];
}

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  status: string;
  orders: OrderWithContact[];
  loading: boolean;
}

// Status color mapping
const statusColors: { [key: string]: string } = {
  'Proposed': '#3B82F6',    // Blue
  'Scheduled': '#F59E0B',   // Amber
  'Complete': '#10B981',    // Green
  'Paid': '#8B5CF6',        // Purple
  'Cancelled': '#EF4444',   // Red
  'Followed Up': '#10B981', // Green (legacy status, same as Complete)
};

function OrdersModal({ isOpen, onClose, month, status, orders, loading }: OrdersModalProps) {
  if (!isOpen) return null;

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-medium text-gray-900">
            {status} Orders - {formatMonth(month)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {status.toLowerCase()} orders found for this month.
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
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.contact_name || 'Unknown Contact'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(order.total.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white`}
                              style={{ backgroundColor: statusColors[order.status] || '#6B7280' }}>
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
      </div>
    </div>
  );
}

export default function OrderCountsChart({ data }: OrderCountsChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [modalOrders, setModalOrders] = useState<OrderWithContact[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Get unique months and statuses
  const months = [...new Set(data.map(item => item.month))].sort();
  const statuses = [...new Set(data.map(item => item.status))].sort();

  // Prepare chart data
  const chartData = {
    labels: months.map(formatMonth),
    datasets: statuses.map(status => ({
      label: status,
      data: months.map(month => {
        const item = data.find(d => d.month === month && d.status === status);
        return item ? item.count : 0;
      }),
      backgroundColor: statusColors[status] || '#6B7280',
      borderColor: statusColors[status] || '#6B7280',
      borderWidth: 1,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
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
        const month = months[elementIndex];
        const status = statuses[datasetIndex];
        
        if (month && status) {
          setSelectedMonth(month);
          setSelectedStatus(status);
          setModalLoading(true);
          
          try {
            const response = await fetch(`/api/orders/by-month-status?month=${month}&status=${status}`);
            if (response.ok) {
              const orders = await response.json();
              setModalOrders(orders);
            } else {
              console.error('Failed to fetch orders for month and status:', month, status);
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
    setSelectedStatus(null);
    setModalOrders([]);
  };

  return (
    <>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      
      <OrdersModal
        isOpen={!!(selectedMonth && selectedStatus)}
        onClose={closeModal}
        month={selectedMonth || ''}
        status={selectedStatus || ''}
        orders={modalOrders}
        loading={modalLoading}
      />
    </>
  );
}
