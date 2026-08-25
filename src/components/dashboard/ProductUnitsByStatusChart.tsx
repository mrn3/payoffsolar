'use client';

import React, { useEffect, useState } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Product } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type TimePeriod = 'year' | 'month' | 'week' | 'day' | 'yoy';
type ProductOption = Pick<Product, 'id' | 'name' | 'sku' | 'is_active'>;

interface ProductUnitsRow {
  year?: string;
  month?: string;
  week?: string;
  day?: string;
  month_num?: number;
  status: string;
  units: number | string;
}

interface ProductUnitsByStatusChartProps {
  products: ProductOption[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS: Record<string, string> = {
  proposed: '#3B82F6',
  confirmed: '#06B6D4',
  scheduled: '#F59E0B',
  in_progress: '#F97316',
  complete: '#10B981',
  completed: '#10B981',
  paid: '#8B5CF6',
  cancelled: '#EF4444',
};
const FALLBACK_COLORS = ['#6B7280', '#EC4899', '#14B8A6', '#84CC16', '#6366F1'];

function getPeriod(row: ProductUnitsRow) {
  return String(row.year || row.month || row.week || row.day || '');
}

function formatPeriodLabel(period: string, timePeriod: TimePeriod) {
  if (timePeriod === 'year') return period;
  if (timePeriod === 'month') {
    const [year, month] = period.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
  if (timePeriod === 'week') return `W${period.split('-')[1] || period}`;
  return new Date(`${period}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function statusColor(status: string, index: number) {
  return STATUS_COLORS[status.toLowerCase()] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export default function ProductUnitsByStatusChart({ products }: ProductUnitsByStatusChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [productId, setProductId] = useState('');
  const [rows, setRows] = useState<ProductUnitsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      const params = new URLSearchParams({ timePeriod });
      const countParameters: Record<TimePeriod, [string, string]> = {
        year: ['years', '5'],
        month: ['months', '12'],
        week: ['weeks', '20'],
        day: ['days', '31'],
        yoy: ['years', '3'],
      };
      params.set(...countParameters[timePeriod]);
      if (productId) params.set('productId', productId);

      try {
        const response = await fetch(`/api/dashboard/product-units-by-status?${params.toString()}`);
        const data = response.ok ? await response.json() : [];
        if (!cancelled) setRows(data);
      } catch (error) {
        console.error('Error fetching product units by status:', error);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [productId, timePeriod]);

  const availableStatuses = [...new Set(rows.map((row) => row.status))].sort();
  const statusOptions = selectedStatus && !availableStatuses.includes(selectedStatus)
    ? [...availableStatuses, selectedStatus].sort()
    : availableStatuses;
  const filteredRows = selectedStatus
    ? rows.filter((row) => row.status === selectedStatus)
    : rows;
  const statuses = [...new Set(filteredRows.map((row) => row.status))].sort();
  const periods = timePeriod === 'yoy'
    ? []
    : [...new Set(rows.map(getPeriod))].filter(Boolean).sort();
  const years = timePeriod === 'yoy'
    ? [...new Set(rows.map((row) => String(row.year || '')))].filter(Boolean).sort()
    : [];

  const unitsFor = (period: string, status: string) => filteredRows
    .filter((row) => getPeriod(row) === period && row.status === status)
    .reduce((total, row) => total + (Number(row.units) || 0), 0);

  const yoyUnitsFor = (year: string, month: number, status: string) => filteredRows
    .filter((row) => String(row.year) === year && Number(row.month_num) === month && row.status === status)
    .reduce((total, row) => total + (Number(row.units) || 0), 0);

  const chartData = timePeriod === 'yoy'
    ? {
        labels: MONTH_LABELS,
        datasets: years.flatMap((year) => statuses.map((status, statusIndex) => ({
          label: `${year} – ${status}`,
          data: MONTH_LABELS.map((_, monthIndex) => yoyUnitsFor(year, monthIndex + 1, status)),
          backgroundColor: statusColor(status, statusIndex),
          borderColor: statusColor(status, statusIndex),
          borderWidth: 1,
          stack: year,
        }))),
      }
    : {
        labels: periods.map((period) => formatPeriodLabel(period, timePeriod)),
        datasets: statuses.map((status, statusIndex) => ({
          label: status,
          data: periods.map((period) => unitsFor(period, status)),
          backgroundColor: statusColor(status, statusIndex),
          borderColor: statusColor(status, statusIndex),
          borderWidth: 1,
        })),
      };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { stacked: true },
      y: {
        stacked: true,
        beginAtZero: true,
        title: { display: true, text: 'Number of Units' },
        ticks: { precision: 0 },
      },
    },
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="product-units-time-period" className="block text-sm font-medium text-gray-700 mb-2">
            Time Period
          </label>
          <select
            id="product-units-time-period"
            value={timePeriod}
            onChange={(event) => setTimePeriod(event.target.value as TimePeriod)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="year">By Year (Last 5 years)</option>
            <option value="month">By Month (Last 12 months)</option>
            <option value="week">By Week (Last 20 weeks)</option>
            <option value="day">By Day (Last 31 days)</option>
            <option value="yoy">Year over Year (Last 3 years)</option>
          </select>
        </div>
        <div>
          <label htmlFor="product-units-status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="product-units-status"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-units-product" className="block text-sm font-medium text-gray-700 mb-2">
            Product
          </label>
          <select
            id="product-units-product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku}){product.is_active ? '' : ' — Inactive'}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-72">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}