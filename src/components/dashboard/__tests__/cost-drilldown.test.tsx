import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ActiveElement, ChartEvent } from 'chart.js';

let clickChart: (event: ChartEvent, elements: Pick<ActiveElement, 'index' | 'datasetIndex'>[]) => Promise<void>;

vi.mock('react-chartjs-2', () => ({
  Bar: ({ options }: { options: { onClick: typeof clickChart } }) => {
    clickChart = options.onClick;
    return <div data-testid="bar-chart" />;
  },
}));

import CostBreakdownChart from '../CostBreakdownChart';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function clickBar() {
  await act(async () => {
    await clickChart(
      { type: 'click', native: null, x: 0, y: 0 },
      [{ index: 0, datasetIndex: 0 }]
    );
  });
}

describe('cost chart drill-downs', () => {
  it.each([
    { type: 'year', period: '2026' },
    { type: 'month', period: '2026-10' },
    { type: 'week', period: '2026-43' },
    { type: 'day', period: '2026-10-30' },
  ])('opens cost orders by $type and sums matching category items', async ({ type, period }) => {
    const fetch = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.includes('/by-')
        ? [{
            id: 'order-1', contact_name: 'Commission Customer', status: 'complete', total: 1000,
            costItems: [
              { category_name: 'Kip Commission', amount: '125' },
              { category_name: 'Kip Commission', amount: '75' },
              { category_name: 'Labor', amount: 500 },
            ],
          }]
        : [{ [type]: period, category_name: 'Kip Commission', total_amount: 200 }],
    }));
    vi.stubGlobal('fetch', fetch);
    render(<CostBreakdownChart initialData={[]} categories={[{ id: 'kip', name: 'Kip Commission' }]} />);
    await screen.findByTestId('bar-chart');
    if (type !== 'month') {
      await userEvent.selectOptions(screen.getByLabelText('Time Period'), type);
      await screen.findByTestId('bar-chart');
    }
    await userEvent.selectOptions(screen.getByLabelText('Filter by Category'), 'kip');
    await clickBar();

    expect(fetch).toHaveBeenCalledWith(`/api/orders/by-${type}-category?${type}=${period}&category=Kip%20Commission`);
    expect(await screen.findByText('Commission Customer')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
    expect(screen.queryByText(/No orders found/)).not.toBeInTheDocument();
  });

  it('displays a failed request as an error rather than an empty result', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
      ok: !url.includes('/by-'),
      status: 500,
      json: async () => [{ month: '2026-10', category_name: 'Kip Commission', total_amount: 125 }],
    })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CostBreakdownChart initialData={[]} categories={[]} />);
    await screen.findByTestId('bar-chart');
    await clickBar();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Unable to load orders'));
    expect(screen.queryByText(/No orders found/)).not.toBeInTheDocument();
  });
});
