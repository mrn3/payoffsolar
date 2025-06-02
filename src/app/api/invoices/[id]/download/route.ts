import { NextRequest, NextResponse } from 'next/server';
import { InvoiceModel, OrderModel } from '@/lib/models';
import { requireAuth, isCustomer } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth();
    const profile = session.profile;

    const { id } = await params;
    
    let invoice;
    if (isCustomer(profile.role)) {
      // Customer users can only download their own invoices
      invoice = await InvoiceModel.getByIdForUser(id, profile.id);
    } else {
      // Admin and other roles can download all invoices
      invoice = await InvoiceModel.getWithDetails(id);
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get the associated order details
    const order = await OrderModel.getWithItems(invoice.order_id);

    // Generate simple HTML for the invoice
    const html = generateInvoiceHTML(invoice, order);

    // For now, return HTML. In a production app, you'd want to use a PDF library like puppeteer or jsPDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating invoice download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateInvoiceHTML(invoice: any, order: any) {
  const customerName = invoice.customer_first_name && invoice.customer_last_name
    ? `${invoice.customer_first_name} ${invoice.customer_last_name}`
    : 'Unknown Customer';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-info {
            text-align: left;
        }
        .invoice-info {
            text-align: right;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #16a34a;
        }
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .billing-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .bill-to, .invoice-details {
            width: 45%;
        }
        .bill-to h3, .invoice-details h3 {
            margin-bottom: 10px;
            color: #333;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th, .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .items-table .text-right {
            text-align: right;
        }
        .total-section {
            text-align: right;
            margin-top: 20px;
        }
        .total-amount {
            font-size: 20px;
            font-weight: bold;
            color: #16a34a;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid { background-color: #dcfce7; color: #166534; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-overdue { background-color: #fee2e2; color: #991b1b; }
        .status-draft { background-color: #f3f4f6; color: #374151; }
        .status-sent { background-color: #dbeafe; color: #1e40af; }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <div class="company-name">Payoff Solar</div>
            <div>Solar Installation & Services</div>
        </div>
        <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div><strong>${invoice.invoice_number}</strong></div>
        </div>
    </div>

    <div class="billing-info">
        <div class="bill-to">
            <h3>Bill To:</h3>
            <div><strong>${customerName}</strong></div>
            ${invoice.customer_email ? `<div>${invoice.customer_email}</div>` : ''}
        </div>
        <div class="invoice-details">
            <h3>Invoice Details:</h3>
            <div><strong>Invoice Date:</strong> ${format(new Date(invoice.created_at), 'MMMM d, yyyy')}</div>
            ${invoice.due_date ? `<div><strong>Due Date:</strong> ${format(new Date(invoice.due_date), 'MMMM d, yyyy')}</div>` : ''}
            <div><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status}</span></div>
            ${order ? `<div><strong>Order:</strong> #${order.id.slice(-8)}</div>` : ''}
        </div>
    </div>

    ${order?.items && order.items.length > 0 ? `
    <table class="items-table">
        <thead>
            <tr>
                <th>Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${order.items.map((item: any) => `
                <tr>
                    <td>${item.product_name || 'Unknown Product'}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">$${Number(item.price).toFixed(2)}</td>
                    <td class="text-right">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : `
    <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <p><strong>Service:</strong> Solar Installation & Services</p>
        <p><strong>Amount:</strong> $${Number(invoice.amount).toFixed(2)}</p>
    </div>
    `}

    <div class="total-section">
        <div style="margin-bottom: 10px;">
            <strong>Subtotal: $${Number(invoice.amount).toFixed(2)}</strong>
        </div>
        <div class="total-amount">
            <strong>Total Amount: $${Number(invoice.amount).toFixed(2)}</strong>
        </div>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
        <p>Thank you for your business!</p>
        <p>For questions about this invoice, please contact us.</p>
    </div>

    <script>
        // Auto-print when opened in new window
        if (window.location.search.includes('print=true')) {
            window.print();
        }
    </script>
</body>
</html>
  `;
}
