import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import puppeteer from 'puppeteer';
import { requireAuth, isContact } from '@/lib/auth';
import { OrderModel, InvoiceModel, SiteSettingsModel } from '@/lib/models';
import { sendEmail, sendEmailWithAttachment } from '@/lib/email';
import { trackOutboundEmail } from '@/lib/communication/tracking';

export const runtime = 'nodejs';

const BodySchema = z.object({
  to: z.string().email('Invalid email address'),
  contactId: z.string().optional(),
  mode: z.enum(['link', 'pdf', 'both']).default('both')
});

function getBaseUrl(req: NextRequest) {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

async function generateInvoiceHTML(order: any, invoice: any, businessAddress: string, businessPhone: string) {
  const { format } = await import('date-fns');
  const orderDate = format(new Date(order.order_date), 'MMMM d, yyyy');
  const invoiceDate = format(new Date(invoice.created_at), 'MMMM d, yyyy');
  const dueDate = format(new Date(invoice.due_date), 'MMMM d, yyyy');
  const calculatedTotal = order.items?.reduce((t: number, it: any) => t + Number(it.price) * it.quantity, 0) || 0;
  return `<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Invoice ${invoice.invoice_number}</title></head><body><h1>Invoice ${invoice.invoice_number}</h1><p>Date: ${invoiceDate} | Due: ${dueDate}</p><p>Bill To: ${order.contact_name || ''}</p><p>Business: ${businessAddress} • ${businessPhone}</p><hr/><table width='100%' style='border-collapse:collapse'><thead><tr><th align='left'>Product</th><th align='right'>Qty</th><th align='right'>Unit</th><th align='right'>Total</th></tr></thead><tbody>${(order.items||[]).map((it:any)=>`<tr><td>${it.product_name||'Item'}</td><td align='right'>${it.quantity}</td><td align='right'>$${Number(it.price).toFixed(2)}</td><td align='right'>$${(Number(it.price)*it.quantity).toFixed(2)}</td></tr>`).join('')}</tbody></table><h3 style='text-align:right'>Amount Due: $${calculatedTotal.toFixed(2)}</h3><p>Payment Options: Venmo https://venmo.com/u/mattrnewman, Cash App https://cash.app/$mattrnewman, Apple Pay (801) 448-6396, Zelle mattrobertnewman@gmail.com, PayPal lisafunknewman@gmail.com, bank transfer Wells Fargo 8904437012 and America First 6782882, existing wire instructions, cash/check in-person (credit cards +3%).</p></body></html>`;
}

async function generateInvoicePDF(html: string): Promise<Buffer> {
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (isContact(session.profile.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { to, contactId, mode } = BodySchema.parse(body);

    const order = await OrderModel.getWithItems(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    let invoice = await InvoiceModel.getByOrderId(id);
    if (!invoice) {
      const invoiceId = await InvoiceModel.createFromOrder(id);
      invoice = await InvoiceModel.getById(invoiceId);
    }
    if (!invoice) return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });

    const businessAddress = await SiteSettingsModel.getValue('business_address') || '11483 S Wexford Way, South Jordan, UT 84009';
    const businessPhone = await SiteSettingsModel.getValue('business_phone') || '(801) 448-6396';

    const html = await generateInvoiceHTML(order, invoice, businessAddress, businessPhone);
    const baseUrl = getBaseUrl(request);
    const invoiceUrl = `${baseUrl}/api/orders/${id}/invoice`;

    const subject = `Invoice From Payoff Solar — Order #${order.id.substring(0, 8)}`;
    const emailHtml = `<p>Hi ${order.contact_name || ''},</p><p>Your invoice is available here: <a href="${invoiceUrl}">${invoiceUrl}</a></p><p>A PDF copy is attached.</p><p>Thank you!<br/>Payoff Solar</p>`;

    let sendOk = false;
    if (mode === 'pdf' || mode === 'both') {
      try {
        const pdf = await generateInvoicePDF(html);
        sendOk = await sendEmailWithAttachment({
          to,
          subject,
          html: emailHtml,
          text: `View your invoice: ${invoiceUrl}`,
          attachments: [
            { filename: `invoice-${invoice.invoice_number}.pdf`, contentType: 'application/pdf', content: pdf }
          ]
        });
        if (!sendOk) {
          console.warn('sendEmailWithAttachment returned false; falling back to link-only email');
          sendOk = await sendEmail({ to, subject, html: emailHtml, text: `View your invoice: ${invoiceUrl}` });
        }
      } catch (e) {
        console.error('Invoice PDF generation or email with attachment failed, falling back to link-only email:', e);
        // Fallback to link-only
        sendOk = await sendEmail({ to, subject, html: emailHtml, text: `View your invoice: ${invoiceUrl}` });
      }
    } else {
      sendOk = await sendEmail({ to, subject, html: emailHtml, text: `View your invoice: ${invoiceUrl}` });
    }

    if (!sendOk) return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });

    try {
      const emailId = await trackOutboundEmail({
        contactId,
        fromEmail: process.env.SES_FROM_EMAIL || 'noreply@payoffsolar.com',
        toEmail: to,
        subject,
        bodyText: `View your invoice: ${invoiceUrl}`,
        bodyHtml: emailHtml
      });
      return NextResponse.json({ success: true, emailId });
    } catch (trackingError) {
      console.error('Error tracking invoice email:', trackingError);
      return NextResponse.json({ success: true, warning: 'Email sent but tracking failed' });
    }
  } catch (error) {
    console.error('Error sending invoice email:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

