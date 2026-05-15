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

type TimePeriod = 'year' | 'month' | 'week' | 'day' | 'yoy';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YOY_YEAR_COLORS = [
	{ bg: 'rgba(156, 163, 175, 0.8)', border: 'rgba(156, 163, 175, 1)' },
	{ bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)' },
	{ bg: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 1)' },
];

interface RevenueData {
	year?: string;
	month?: string;
	week?: string;
	day?: string;
	month_num?: number;
	revenue: number;
	count: number;
}

interface RevenueChartProps {
	initialData: RevenueData[];
}

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  orders: OrderWithContact[];
  loading: boolean;
}

function OrdersModal({ isOpen, onClose, month, orders, loading }: OrdersModalProps) {
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
            Complete Orders - {formatMonth(month)}
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
              No complete orders found for this month.
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

	export default function RevenueChart({ initialData }: RevenueChartProps) {
	  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
	  const [data, setData] = useState<RevenueData[]>(initialData || []);
	  const [dataLoading, setDataLoading] = useState(false);
	const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
	const [modalOrders, setModalOrders] = useState<OrderWithContact[]>([]);
	const [modalLoading, setModalLoading] = useState(false);

	// Keep local data in sync if server-provided initial data changes
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
				case 'yoy':
					params.append('years', '3');
					break;
			}

			const response = await fetch(`/api/dashboard/revenue?${params.toString()}`);
			if (response.ok) {
				const newData = await response.json();
				setData(newData);
			} else {
				console.error('Failed to fetch revenue data');
				setData([]);
			}
		} catch (error) {
			console.error('Error fetching revenue data:', error);
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

	  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

	const getItemPeriod = (item: RevenueData) =>
		String(item.year || item.month || item.week || item.day || '');

	const periods = timePeriod === 'yoy'
		? []
		: [...new Set(data.map(getItemPeriod))].filter((p) => p).sort();

	const periodMetrics = periods.reduce((acc, period) => {
		const metrics = data
			.filter((item) => getItemPeriod(item) === period)
			.reduce(
				(totals, item) => {
					totals.revenue += item.revenue;
					totals.count += item.count;
					return totals;
				},
				{ revenue: 0, count: 0 }
			);
		acc[period] = metrics;
		return acc;
	}, {} as Record<string, { revenue: number; count: number }>);

	// Year-over-year aggregation: build [year][month] totals
	const yoyYears = timePeriod === 'yoy'
		? [...new Set(data.map((d) => String(d.year || '')))].filter((y) => y).sort()
		: [];

	const yoyMetrics: Record<string, Record<number, { revenue: number; count: number }>> = {};
	if (timePeriod === 'yoy') {
		for (const year of yoyYears) {
			yoyMetrics[year] = {};
			for (let m = 1; m <= 12; m++) {
				yoyMetrics[year][m] = { revenue: 0, count: 0 };
			}
		}
		for (const item of data) {
			const y = String(item.year || '');
			const m = Number(item.month_num || 0);
			if (y && m >= 1 && m <= 12 && yoyMetrics[y]) {
				yoyMetrics[y][m].revenue += Number(item.revenue) || 0;
				yoyMetrics[y][m].count += Number(item.count) || 0;
			}
		}
	}

	const chartData = timePeriod === 'yoy'
		? {
			labels: MONTH_LABELS,
			datasets: yoyYears.map((year, index) => {
				const color = YOY_YEAR_COLORS[index % YOY_YEAR_COLORS.length];
				return {
					label: year,
					data: MONTH_LABELS.map((_, i) => yoyMetrics[year]?.[i + 1]?.revenue ?? 0),
					backgroundColor: color.bg,
					borderColor: color.border,
					borderWidth: 1,
					borderRadius: 4,
				};
			}),
		}
		: {
			labels: periods.map((p) => formatPeriodLabel(p)),
			datasets: [
				{
					label: 'Revenue',
					data: periods.map((p) => periodMetrics[p]?.revenue ?? 0),
					backgroundColor: 'rgba(34, 197, 94, 0.8)',
					borderColor: 'rgba(34, 197, 94, 1)',
					borderWidth: 1,
					borderRadius: 4,
				},
			],
		};

  const options = {
    responsive: true,
    maintainAspectRatio: false,
	plugins: {
      legend: {
        display: timePeriod === 'yoy',
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
			label: function (context: any) {
				const revenue = formatCurrency(context.parsed.y);
				if (timePeriod === 'yoy') {
					const year = yoyYears[context.datasetIndex];
					const monthNum = context.dataIndex + 1;
					const count = yoyMetrics[year]?.[monthNum]?.count || 0;
					return `${year}: ${revenue} (${count} orders)`;
				}
				const dataIndex = context.dataIndex;
				const period = periods[dataIndex];
				const count = periodMetrics[period]?.count || 0;
				return `Revenue: ${revenue} (${count} orders)`;
			},
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
	onClick: async (event: ChartEvent, elements: ActiveElement[]) => {
		if (elements.length === 0) return;

		// Drill-down for the standard monthly view
		if (timePeriod === 'month') {
			const period = periods[elements[0].index];
			if (!period) return;
			setSelectedMonth(period);
			setModalLoading(true);
			try {
				const response = await fetch(`/api/orders/by-month?month=${period}`);
				if (response.ok) {
					setModalOrders(await response.json());
				} else {
					console.error('Failed to fetch orders for month:', period);
					setModalOrders([]);
				}
			} catch (error) {
				console.error('Error fetching orders:', error);
				setModalOrders([]);
			} finally {
				setModalLoading(false);
			}
			return;
		}

		// Drill-down for year-over-year view: open the specific year+month
		if (timePeriod === 'yoy') {
			const year = yoyYears[elements[0].datasetIndex];
			const monthNum = elements[0].index + 1;
			if (!year) return;
			const month = `${year}-${String(monthNum).padStart(2, '0')}`;
			setSelectedMonth(month);
			setModalLoading(true);
			try {
				const response = await fetch(`/api/orders/by-month?month=${month}`);
				if (response.ok) {
					setModalOrders(await response.json());
				} else {
					console.error('Failed to fetch orders for month:', month);
					setModalOrders([]);
				}
			} catch (error) {
				console.error('Error fetching orders:', error);
				setModalOrders([]);
			} finally {
				setModalLoading(false);
			}
		}
	},
  };

  const closeModal = () => {
    setSelectedMonth(null);
    setModalOrders([]);
  };

  return (
    <>
	      {/* Time Period Filter Dropdown */}
	      <div className="mb-4">
	        <label htmlFor="revenue-time-period" className="block text-sm font-medium text-gray-700 mb-2">
	          Time Period
	        </label>
	        <select
	          id="revenue-time-period"
	          value={timePeriod}
	          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
	          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
	        >
	          <option value="year">By Year (Last 5 years)</option>
	          <option value="month">By Month (Last 12 months)</option>
	          <option value="week">By Week (Last 20 weeks)</option>
	          <option value="day">By Day (Last 31 days)</option>
	          <option value="yoy">Year over Year (Last 3 years)</option>
	        </select>
	      </div>

	      <div className="h-64">
	        {dataLoading ? (
	          <div className="flex justify-center items-center h-full">
	            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
	          </div>
	        ) : (
	          <Bar data={chartData} options={options} />
	        )}
	      </div>
      
      <OrdersModal
        isOpen={!!selectedMonth}
        onClose={closeModal}
        month={selectedMonth || ''}
        orders={modalOrders}
        loading={modalLoading}
      />
    </>
  );
}
