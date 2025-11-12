import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { requireAuth, isContact } from '@/lib/auth';
import { OrderModel, SiteSettingsModel } from '@/lib/models';
import { format } from 'date-fns';

export const runtime = 'nodejs';

async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '16mm', right: '12mm', bottom: '16mm', left: '12mm' } });
    await page.close();
    return pdf as Buffer;
  } finally {
    await browser.close();
  }
}

function generateOrderReceiptHTML(order: any, businessAddress: string, businessPhone: string): string {
  const orderDate = format(new Date(order.order_date), 'MMMM d, yyyy');
  const contactName = order.contact_name;
  return `
  <!DOCTYPE html>
  <html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Order Receipt #${order.id.substring(0, 8)}</title>
  <style>body{font-family:Arial, sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;color:#333}.header{text-align:center;border-bottom:2px solid #16a34a;padding-bottom:20px;margin-bottom:30px}.company-name{font-size:2em;font-weight:bold;color:#16a34a;margin-bottom:5px}.receipt-title{font-size:1.5em;color:#666;margin-top:10px}.receipt-info{display:flex;justify-content:space-between;margin-bottom:30px;flex-wrap:wrap}.info-section{flex:1;min-width:250px;margin-bottom:20px}.items-table{width:100%;border-collapse:collapse;margin-top:20px}.items-table th,.items-table td{border:1px solid #ddd;padding:8px;text-align:left}.items-table th{background-color:#f3f4f6}.price{text-align:right}.total{font-weight:bold} .footer{margin-top:40px;text-align:center;color:#666}</style>
  </head><body>
  <div class="header"><div class="company-name">Payoff Solar</div><div class="receipt-title">Order Receipt</div></div>
  <div class="receipt-info">
    <div class="info-section"><h3>Order Information</h3><p><strong>Order ID:</strong> #${order.id.substring(0, 8)}</p><p><strong>Date:</strong> ${orderDate}</p><p><strong>Status:</strong> ${order.status}</p></div>
    <div class="info-section"><h3>Customer</h3><p>${contactName || ''}</p>${order.contact_email ? `<p>${order.contact_email}</p>` : ''}${order.contact_phone ? `<p>${order.contact_phone}</p>` : ''}</div>
  </div>
  <div class="info-section" style="text-align:center;margin-bottom:30px;padding:20px;background-color:#f9fafb;border-radius:8px;"><h3 style="margin-bottom:10px;color:#374151;">Business Information</h3><p style="margin:5px 0;color:#6b7280;"><strong>Address:</strong> ${businessAddress}</p><p style="margin:5px 0;color:#6b7280;"><strong>Phone:</strong> ${businessPhone}</p></div>
  <h3>Order Items</h3>
  <table class="items-table"><thead><tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
  ${(order.items || []).map((item: any) => `<tr><td>${item.product_name || 'Unknown Product'}</td><td>${item.product_sku || 'N/A'}</td><td>${item.quantity}</td><td class="price">$${Number(item.price).toFixed(2)}</td><td class="price">$${(Number(item.price) * item.quantity).toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="5">No items found</td></tr>'}
  </tbody><tfoot><tr><td colspan="4" class="total">Total</td><td class="price total">$${Number(order.total).toFixed(2)}</td></tr></tfoot></table>
  <div class="footer">Thank you for your business!</div>
  </body></html>`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const profile = session.profile;
    const { id } = await params;

    let order: any;
    if (isContact(profile.role)) {
      order = await OrderModel.getByIdForUser(id, profile.id);
    } else {
      order = await OrderModel.getWithItems(id);
    }
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const businessAddress = await SiteSettingsModel.getValue('business_address') || '11483 S Wexford Way, South Jordan, UT 84009';
    const businessPhone = await SiteSettingsModel.getValue('business_phone') || '(801) 448-6396';

    const html = generateOrderReceiptHTML(order, businessAddress, businessPhone);
    const filename = `receipt-${order.id.substring(0, 8)}.pdf`;
    const pdfBuffer = await generatePdfFromHtml(html);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

