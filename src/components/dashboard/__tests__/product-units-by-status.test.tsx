import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

interface CapturedDataset {
  label: string;
  data: number[];
  stack?: string;
}

interface CapturedBarProps {
  data: { labels: string[]; datasets: CapturedDataset[] };
  options: { scales: { x: { stacked: boolean }; y: { stacked: boolean } } };
}

const barProps: CapturedBarProps[] = [];

vi.mock('react-chartjs-2', () => ({
  Bar: (props: CapturedBarProps) => {
    barProps.push(props);
    return <div data-testid="bar-chart" />;
  },
}));

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  Tooltip: {},
  Legend: {},
}));

import ProductUnitsByStatusChart from '../ProductUnitsByStatusChart';

const products = [
  { id: 'active-1', name: 'Active Panel', sku: 'AP-1', is_active: true },
  { id: 'inactive-1', name: 'Legacy Panel', sku: 'LP-1', is_active: false },
];

beforeEach(() => {
  barProps.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProductUnitsByStatusChart', () => {
  it('stacks status quantities and can filter to an inactive product', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { month: '2026-01', status: 'Proposed', units: '2' },
        { month: '2026-01', status: 'Complete', units: '3' },
        { month: '2026-02', status: 'Proposed', units: '4' },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProductUnitsByStatusChart products={products} />);

    await screen.findByTestId('bar-chart');
    expect(screen.getByRole('option', { name: 'All Products' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Legacy Panel.*Inactive/ })).toBeInTheDocument();

    const latest = barProps.at(-1)!;
    expect(latest.data.datasets.map((dataset) => dataset.label)).toEqual(['Complete', 'Proposed']);
    expect(latest.data.datasets[0].data).toEqual([3, 0]);
    expect(latest.data.datasets[1].data).toEqual([2, 4]);
    expect(latest.options.scales.x.stacked).toBe(true);
    expect(latest.options.scales.y.stacked).toBe(true);

    expect(screen.getByRole('option', { name: 'All Statuses' })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Complete');
    await waitFor(() => {
      const statusFiltered = barProps.at(-1)!;
      expect(statusFiltered.data.datasets.map((dataset) => dataset.label)).toEqual(['Complete']);
      expect(statusFiltered.data.datasets[0].data).toEqual([3, 0]);
    });

    await userEvent.selectOptions(screen.getByLabelText('Product'), 'inactive-1');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('productId=inactive-1'));
    });
  });

  it('renders each year as a stack of order statuses in YoY mode', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.includes('timePeriod=yoy') ? [
        { year: '2024', month_num: 1, status: 'Proposed', units: 2 },
        { year: '2024', month_num: 1, status: 'Complete', units: 3 },
        { year: '2025', month_num: 1, status: 'Complete', units: 5 },
      ] : [],
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<ProductUnitsByStatusChart products={products} />);
    await userEvent.selectOptions(screen.getByLabelText('Time Period'), 'yoy');

    await waitFor(() => {
      const latest = barProps.at(-1)!;
      expect(latest.data.labels).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
      expect(latest.data.datasets.map((dataset) => dataset.label)).toEqual([
        '2024 – Complete',
        '2024 – Proposed',
        '2025 – Complete',
        '2025 – Proposed',
      ]);
      expect(latest.data.datasets.map((dataset) => dataset.stack)).toEqual(['2024', '2024', '2025', '2025']);
      expect(latest.data.datasets[0].data[0]).toBe(3);
      expect(latest.data.datasets[1].data[0]).toBe(2);
      expect(latest.data.datasets[2].data[0]).toBe(5);
    });
  });
});