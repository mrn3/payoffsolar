import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Capture props passed to <Bar /> so we can assert on chart data
const barProps: Array<{ data: any; options: any }> = [];

vi.mock('react-chartjs-2', () => ({
  Bar: (props: any) => {
    barProps.push({ data: props.data, options: props.options });
    return <div data-testid="bar-chart" />;
  },
}));

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

import RevenueChart from '../RevenueChart';
import OrderCountsChart from '../OrderCountsChart';
import RevenueByStateChart from '../RevenueByStateChart';
import UnitsSoldChart from '../UnitsSoldChart';
import CostBreakdownChart from '../CostBreakdownChart';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function mockFetchOnce(rows: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => rows,
    }),
  );
}

async function selectYoY() {
  const user = userEvent.setup();
  const select = await screen.findByLabelText(/Time Period/i);
  await user.selectOptions(select, 'yoy');
}

beforeEach(() => {
  barProps.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Dashboard charts in Year-over-Year mode', () => {
  it('RevenueChart renders YoY with month labels and one dataset per year', async () => {
    mockFetchOnce([
      { year: '2023', month_num: 1, revenue: 100, count: 1 },
      { year: '2024', month_num: 1, revenue: 200, count: 2 },
      { year: '2025', month_num: 12, revenue: 300, count: 3 },
    ]);
    render(<RevenueChart initialData={[]} />);
    await selectYoY();

    await waitFor(() => {
      const last = barProps.at(-1)!;
      expect(last.data.labels).toEqual(MONTH_LABELS);
      expect(last.data.datasets.map((d: any) => d.label)).toEqual(['2023', '2024', '2025']);
      expect(last.data.datasets[0].data[0]).toBe(100);
      expect(last.data.datasets[1].data[0]).toBe(200);
      expect(last.data.datasets[2].data[11]).toBe(300);
    });
  });

  it('OrderCountsChart aggregates statuses per (year, month) into one dataset per year', async () => {
    mockFetchOnce([
      { year: '2024', month_num: 3, status: 'completed', count: 5 },
      { year: '2024', month_num: 3, status: 'paid', count: 7 },
      { year: '2025', month_num: 3, status: 'completed', count: 4 },
    ]);
    render(<OrderCountsChart initialData={[]} />);
    await selectYoY();

    await waitFor(() => {
      const last = barProps.at(-1)!;
      expect(last.data.labels).toEqual(MONTH_LABELS);
      const labels = last.data.datasets.map((d: any) => d.label);
      expect(labels).toEqual(['2024', '2025']);
      expect(last.data.datasets[0].data[2]).toBe(12);
      expect(last.data.datasets[1].data[2]).toBe(4);
    });
  });

  it('RevenueByStateChart aggregates states per (year, month)', async () => {
    mockFetchOnce([
      { year: '2024', month_num: 6, state: 'UT', revenue: 100, count: 1 },
      { year: '2024', month_num: 6, state: 'CA', revenue: 250, count: 2 },
      { year: '2025', month_num: 6, state: 'UT', revenue: 75, count: 1 },
    ]);
    render(<RevenueByStateChart initialData={[]} />);
    await selectYoY();

    await waitFor(() => {
      const last = barProps.at(-1)!;
      expect(last.data.labels).toEqual(MONTH_LABELS);
      expect(last.data.datasets.map((d: any) => d.label)).toEqual(['2024', '2025']);
      expect(last.data.datasets[0].data[5]).toBe(350);
      expect(last.data.datasets[1].data[5]).toBe(75);
    });
  });

  it('UnitsSoldChart aggregates categories per (year, month)', async () => {
    mockFetchOnce([
      { year: '2023', month_num: 9, category: 'Panels', units_sold: 10, order_count: 2 },
      { year: '2023', month_num: 9, category: 'Inverters', units_sold: 5, order_count: 1 },
      { year: '2024', month_num: 9, category: 'Panels', units_sold: 20, order_count: 4 },
    ]);
    render(<UnitsSoldChart categories={[]} />);
    await selectYoY();

    await waitFor(() => {
      const last = barProps.at(-1)!;
      expect(last.data.labels).toEqual(MONTH_LABELS);
      expect(last.data.datasets.map((d: any) => d.label)).toEqual(['2023', '2024']);
      expect(last.data.datasets[0].data[8]).toBe(15);
      expect(last.data.datasets[1].data[8]).toBe(20);
    });
  });

  it('CostBreakdownChart aggregates categories per (year, month)', async () => {
    mockFetchOnce([
      { year: '2023', month_num: 4, category_name: 'Labor', total_amount: 1000 },
      { year: '2023', month_num: 4, category_name: 'Materials', total_amount: 500 },
      { year: '2024', month_num: 4, category_name: 'Labor', total_amount: 1200 },
    ]);
    render(<CostBreakdownChart initialData={[]} categories={[]} />);
    await selectYoY();

    await waitFor(() => {
      const last = barProps.at(-1)!;
      expect(last.data.labels).toEqual(MONTH_LABELS);
      expect(last.data.datasets.map((d: any) => d.label)).toEqual(['2023', '2024']);
      expect(last.data.datasets[0].data[3]).toBe(1500);
      expect(last.data.datasets[1].data[3]).toBe(1200);
    });
  });
});
