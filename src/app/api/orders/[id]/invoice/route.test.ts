// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import type { Invoice, OrderWithItems, Payment } from '@/lib/models';
import { generateInvoiceHTML } from './route';

vi.mock('@/lib/models', () => ({
  OrderModel: {},
  InvoiceModel: {},
  SiteSettingsModel: {},
}));

const date = '2026-10-13';
const invoice: Invoice = {
  id: 'invoice-1',
  order_id: 'order-1',
  invoice_number: 'INV-1',
  amount: '500.00',
  status: 'paid',
  due_date: date,
  created_at: date,
  updated_at: date,
};

const payment = (amount: Payment['amount']): Payment => ({
  id: 'payment-1',
  order_id: 'order-1',
  payment_date: date,
  payment_type: 'Venmo',
  amount,
  created_at: date,
  updated_at: date,
});

const order: OrderWithItems = {
  id: 'order-1',
  contact_id: 'contact-1',
  status: 'Paid',
  total: '500.00',
  order_date: date,
  created_at: date,
  updated_at: date,
  items: [{
    id: 'item-1',
    order_id: 'order-1',
    product_id: 'product-1',
    quantity: 31,
    price: '90.00',
    created_at: date,
  }],
};

const render = (overrides: Partial<OrderWithItems> = {}, status: Invoice['status'] = 'paid') =>
  generateInvoiceHTML({ ...order, ...overrides }, { ...invoice, status }, 'Business address', '555-1234');

describe('invoice payment status', () => {
  it('shows partially paid when a saved paid invoice still has a balance', () => {
    const html = render({ payments: [payment('500.00')] });

    expect(html).toContain('status-badge status-partial">Partially Paid</span>');
    expect(html).not.toContain('Paid In Full');
    expect(html).toContain('$2790.00');
    expect(html).toContain('$500.00');
    expect(html).toContain('$2290.00');
  });

  it.each([undefined, []])('shows pending when payments are %j', (payments) => {
    const html = render({ payments });

    expect(html).toContain('status-badge status-pending">pending</span>');
    expect(html).not.toContain('Paid In Full');
  });

  it('does not consider a zero-dollar payment paid in full', () => {
    expect(render({ payments: [payment(0)] })).not.toContain('Paid In Full');
  });

  it.each([2790, 2800])('keeps paid in full when payments cover the total (%s)', (amount) => {
    expect(render({ payments: [payment(amount)] }))
      .toContain('status-badge status-paid">Paid In Full</span>');
  });

  it('sums multiple payments before deciding whether the invoice is paid', () => {
    expect(render({ payments: [payment('500.00'), payment('2290.00')] }))
      .toContain('status-badge status-paid">Paid In Full</span>');
  });

  it('does not mark an invoice paid while even one cent remains', () => {
    const html = render({ payments: [payment('2789.99')] });

    expect(html).not.toContain('Paid In Full');
    expect(html).toContain('$0.01');
  });

  it('ignores floating-point residue smaller than the displayed currency precision', () => {
    const html = render({
      items: [{ ...order.items![0], quantity: 3, price: '0.10' }],
      payments: [payment('0.30')],
    });

    expect(html).toContain('status-badge status-paid">Paid In Full</span>');
    expect(html).toContain('$0.00');
  });

  it.each(['pending', 'sent', 'overdue', 'cancelled'] as const)('preserves the %s workflow status', (status) => {
    expect(render({ payments: [payment(500)] }, status))
      .toContain(`status-badge status-${status}">${status}</span>`);
  });
});
