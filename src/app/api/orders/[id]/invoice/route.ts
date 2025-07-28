import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isContact } from '@/lib/auth';
import { OrderModel, InvoiceModel, SiteSettingsModel } from '@/lib/models';
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

    let order;
    if (isContact(profile.role)) {
      // Contact users can only view their own order invoices
      order = await OrderModel.getByIdForUser(id, profile.id);
    } else {
      // Admin and other roles can view all order invoices
      order = await OrderModel.getWithItems(id);
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get or create invoice for this order
    let invoice = await InvoiceModel.getByOrderId(id);
    if (!invoice) {
      // Create invoice if it doesn't exist
      const invoiceId = await InvoiceModel.createFromOrder(id);
      invoice = await InvoiceModel.getById(invoiceId);
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Fetch business address and phone number from settings
    const businessAddress = await SiteSettingsModel.getValue('business_address') || '11483 S Wexford Way, South Jordan, UT 84009';
    const businessPhone = await SiteSettingsModel.getValue('business_phone') || '(801) 448-6396';

    // Generate simple HTML for the invoice
    const html = generateInvoiceHTML(order, invoice, businessAddress, businessPhone);

    // Return HTML for viewing
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateInvoiceHTML(order: any, invoice: any, businessAddress: string, businessPhone: string): string {
  const orderDate = format(new Date(order.order_date), 'MMMM d, yyyy');
  const invoiceDate = format(new Date(invoice.created_at), 'MMMM d, yyyy');
  const dueDate = format(new Date(invoice.due_date), 'MMMM d, yyyy');
  const contactName = order.contact_name;
    
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
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 2em;
            font-weight: bold;
            color: #16a34a;
            margin-bottom: 5px;
        }
        .invoice-title {
            font-size: 1.5em;
            color: #666;
            margin-top: 10px;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .info-section {
            flex: 1;
            min-width: 250px;
            margin-bottom: 20px;
        }
        .info-section h3 {
            color: #374151;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        .info-section p {
            margin: 5px 0;
            color: #6b7280;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
        }
        .items-table th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        .items-table .price {
            text-align: right;
        }
        .total-section {
            text-align: right;
            margin-bottom: 30px;
        }
        .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        .total-label {
            margin-right: 20px;
            font-weight: 600;
        }
        .total-amount {
            font-weight: bold;
            color: #16a34a;
            min-width: 100px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.875em;
            font-weight: 500;
            text-transform: capitalize;
        }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-sent { background-color: #dbeafe; color: #1e40af; }
        .status-paid { background-color: #d1fae5; color: #065f46; }
        .status-overdue { background-color: #fee2e2; color: #991b1b; }
        .status-cancelled { background-color: #f3f4f6; color: #6b7280; }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .invoice-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .invoice-details h3 {
            margin-top: 0;
            color: #1e293b;
        }
        .invoice-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        @media (max-width: 600px) {
            .invoice-info {
                flex-direction: column;
            }
            .invoice-meta {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Payoff Solar</div>
        <div class="invoice-title">INVOICE</div>
    </div>

    <div class="info-section" style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="margin-bottom: 10px; color: #374151;">Business Information</h3>
        <p style="margin: 5px 0; color: #6b7280;"><strong>Address:</strong> ${businessAddress}</p>
        <p style="margin: 5px 0; color: #6b7280;"><strong>Phone:</strong> ${businessPhone}</p>
    </div>

    <div class="invoice-details">
        <h3>Invoice Details</h3>
        <div class="invoice-meta">
            <div>
                <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
                <p><strong>Due Date:</strong> ${dueDate}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status}</span></p>
            </div>
            <div>
                <p><strong>Order ID:</strong> #${order.id.substring(0, 8)}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Order Status:</strong> ${order.status}</p>
            </div>
        </div>
    </div>

    <div class="invoice-info">
        <div class="info-section">
            <h3>Bill To</h3>
            <p><strong>Name:</strong> ${contactName || 'N/A'}</p>
            ${order.contact_email ? `<p><strong>Email:</strong> ${order.contact_email}</p>` : ''}
            ${order.contact_phone ? `<p><strong>Phone:</strong> ${order.contact_phone}</p>` : ''}
            ${order.contact_address ? `<p><strong>Address:</strong> ${order.contact_address}</p>` : ''}
            ${order.contact_city && order.contact_state ? `<p><strong>City, State:</strong> ${order.contact_city}, ${order.contact_state}</p>` : ''}
        </div>
    </div>

    ${order.notes ? `
    <div class="info-section">
        <h3>Order Notes</h3>
        <p>${order.notes}</p>
    </div>
    ` : ''}

    <h3>Invoice Items</h3>
    <table class="items-table">
        <thead>
            <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${order.items?.map((item: any) => `
                <tr>
                    <td>${item.product_name || 'Unknown Product'}</td>
                    <td>${item.product_sku || 'N/A'}</td>
                    <td>${item.quantity}</td>
                    <td class="price">$${Number(item.price).toFixed(2)}</td>
                    <td class="price">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
            `).join('') || '<tr><td colspan="5">No items found</td></tr>'}
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <div class="total-label">Invoice Total:</div>
            <div class="total-amount">$${Number(invoice.amount).toFixed(2)}</div>
        </div>
    </div>

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>Payoff Solar - Powering Your Future with Clean Energy</p>
        <p>Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}</p>
        ${invoice.status === 'pending' || invoice.status === 'sent' ? `<p style="margin-top: 15px; font-weight: bold; color: #dc2626;">Payment Due: ${dueDate}</p>` : ''}
    </div>
</body>
</html>
  `.trim();
}
