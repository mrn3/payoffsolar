'use client';

import React, { useEffect, useState } from 'react';
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

interface OrderCountData {
	year?: string;
	month?: string;
	week?: string;
	day?: string;
	status: string;
	count: number;
}

interface OrderCountsChartProps {
	initialData: OrderCountData[];
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

export default function OrderCountsChart({ initialData }: OrderCountsChartProps) {
	const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
	const [data, setData] = useState<OrderCountData[]>(initialData || []);
	const [dataLoading, setDataLoading] = useState(false);
	const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
	const [modalOrders, setModalOrders] = useState<OrderWithContact[]>([]);
	const [modalLoading, setModalLoading] = useState(false);

	// Keep local data in sync with server-provided initial data
	useEffect(() => {
		setData(initialData || []);
	}, [initialData]);

	// Fetch chart data based on selected time period
	const fetchData = async (period: TimePeriod) => {
		setDataLoading(true);
		try {
			const params = new URLSearchParams();
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

			const response = await fetch(`/api/dashboard/order-counts?${params.toString()}`);
			if (response.ok) {
				const newData = await response.json();
				setData(newData);
			} else {
				console.error('Failed to fetch order counts data');
				setData([]);
			}
		} catch (error) {
			console.error('Error fetching order counts data:', error);
			setData([]);
		} finally {
			setDataLoading(false);
		}
	};

	// Initial fetch and whenever time period changes
	useEffect(() => {
		fetchData(timePeriod);
	}, [timePeriod]);

	const formatPeriodLabel = (period: string | number) => {
		const periodStr = String(period);
		if (timePeriod === 'year') {
			return periodStr;
		} else if (timePeriod === 'month') {
			const parts = periodStr.split('-');
			if (parts.length >= 2) {
				const [year, month] = parts;
				const date = new Date(parseInt(year), parseInt(month) - 1);
				return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
			}
			return periodStr;
		} else if (timePeriod === 'week') {
			const parts = periodStr.split('-');
			return parts.length > 1 ? `W${parts[1]}` : periodStr;
		} else {
			const date = new Date(periodStr);
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	};

	const getItemPeriod = (item: OrderCountData) =>
		String(item.year || item.month || item.week || item.day || '');

	// Get unique periods and statuses
	const periods = [...new Set(data.map(getItemPeriod))]
		.filter((p) => p)
		.sort();
	const statuses = [...new Set(data.map((item) => item.status))].sort();

	const getCountFor = (period: string, status: string) => {
		return data
			.filter((item) => getItemPeriod(item) === period && item.status === status)
			.reduce((sum, item) => sum + item.count, 0);
	};

	// Prepare chart data
	const chartData = {
		labels: periods.map((p) => formatPeriodLabel(p)),
		datasets: statuses.map((status) => ({
			label: status,
			data: periods.map((period) => getCountFor(period, status)),
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
		if (elements.length === 0) return;

		const elementIndex = elements[0].index;
		const datasetIndex = elements[0].datasetIndex;
		const period = periods[elementIndex];
		const status = statuses[datasetIndex];

		// Drill-down is only supported for monthly view
		if (!period || !status || timePeriod !== 'month') {
			return;
		}

		const month = period;
		setSelectedMonth(month);
		setSelectedStatus(status);
		setModalLoading(true);

		try {
			const response = await fetch(
				`/api/orders/by-month-status?month=${month}&status=${encodeURIComponent(status)}`
			);
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
	},
  };

  const closeModal = () => {
    setSelectedMonth(null);
    setSelectedStatus(null);
    setModalOrders([]);
  };

  return (
    <>
	      {/* Time Period Filter Dropdown */}
	      <div className="mb-4">
	        <label htmlFor="order-counts-time-period" className="block text-sm font-medium text-gray-700 mb-2">
	          Time Period
	        </label>
	        <select
	          id="order-counts-time-period"
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
