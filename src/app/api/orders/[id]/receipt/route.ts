import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isContact } from '@/lib/auth';
import { OrderModel, SiteSettingsModel } from '@/lib/models';
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
      // Contact users can only download their own order receipts
      order = await OrderModel.getByIdForUser(id, profile.id);
    } else {
      // Admin and other roles can download all order receipts
      order = await OrderModel.getWithItems(id);
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch business address and phone number from settings
    const businessAddress = await SiteSettingsModel.getValue('business_address') || '11483 S Wexford Way, South Jordan, UT 84009';
    const businessPhone = await SiteSettingsModel.getValue('business_phone') || '(801) 448-6396';

    // Generate simple HTML for the order receipt
    const html = generateOrderReceiptHTML(order, businessAddress, businessPhone);

    // For now, return HTML. In a production app, you'd want to use a PDF library like puppeteer or jsPDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="order-receipt-${order.id.substring(0, 8)}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating order receipt download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateOrderReceiptHTML(order: any, businessAddress: string, businessPhone: string): string {
  const orderDate = format(new Date(order.order_date), 'MMMM d, yyyy');
  const contactName = order.contact_name;
    
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Receipt #${order.id.substring(0, 8)}</title>
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
        .receipt-title {
            font-size: 1.5em;
            color: #666;
            margin-top: 10px;
        }
        .receipt-info {
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
            color: #16a34a;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 10px;
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
            font-weight: bold;
            color: #374151;
        }
        .items-table .price {
            text-align: right;
        }
        .total-section {
            text-align: right;
            margin-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
        }
        .total-label {
            width: 150px;
            text-align: right;
            margin-right: 20px;
            font-weight: bold;
        }
        .total-amount {
            width: 100px;
            text-align: right;
            font-weight: bold;
            font-size: 1.2em;
            color: #16a34a;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-proposed { background-color: #fef3c7; color: #92400e; }
        .status-scheduled { background-color: #dbeafe; color: #1e40af; }
        .status-complete { background-color: #d1fae5; color: #065f46; }
        .status-paid { background-color: #f3e8ff; color: #7c3aed; }
        .status-cancelled { background-color: #fee2e2; color: #991b1b; }
        
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Payoff Solar</div>
        <div class="receipt-title">Order Receipt</div>
    </div>

    <div class="info-section" style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="margin-bottom: 10px; color: #374151;">Business Information</h3>
        <p style="margin: 5px 0; color: #6b7280;"><strong>Address:</strong> ${businessAddress}</p>
        <p style="margin: 5px 0; color: #6b7280;"><strong>Phone:</strong> ${businessPhone}</p>
    </div>

    <div class="receipt-info">
        <div class="info-section">
            <h3>Order Information</h3>
            <p><strong>Order ID:</strong> #${order.id.substring(0, 8)}</p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${order.status.replace(/\s+/g, '-')}">${order.status}</span></p>
        </div>
        
        <div class="info-section">
            <h3>Contact Information</h3>
            <p><strong>Name:</strong> ${contactName || 'N/A'}</p>
            ${order.contact_email ? `<p><strong>Email:</strong> ${order.contact_email}</p>` : ''}
            ${order.contact_phone ? `<p><strong>Phone:</strong> ${order.contact_phone}</p>` : ''}
        </div>
    </div>

    ${order.notes ? `
    <div class="info-section">
        <h3>Order Notes</h3>
        <p>${order.notes}</p>
    </div>
    ` : ''}

    <h3>Order Items</h3>
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
            <div class="total-label">Order Total:</div>
            <div class="total-amount">$${Number(order.total).toFixed(2)}</div>
        </div>
    </div>

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>Payoff Solar - Powering Your Future with Clean Energy</p>
        <p>Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}</p>
    </div>
</body>
</html>
  `.trim();
}
