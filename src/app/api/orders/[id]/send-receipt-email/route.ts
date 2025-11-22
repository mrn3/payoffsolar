import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import puppeteer from 'puppeteer';
import { requireAuth, isContact } from '@/lib/auth';
import { OrderModel, SiteSettingsModel } from '@/lib/models';
import { sendEmail, sendEmailWithAttachment } from '@/lib/email';
import { format } from 'date-fns';
import { trackOutboundEmail } from '@/lib/communication/tracking';

export const runtime = 'nodejs';

const BodySchema = z.object({
  to: z.string().email('Invalid email address'),
  contactId: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
});

function getBaseUrl(req: NextRequest) {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

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

import { generateOrderReceiptHTML } from '../receipt/route';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (isContact(session.profile.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { to, contactId, subject: subjectOverride, body: bodyOverride } = BodySchema.parse(body);

    const order = await OrderModel.getWithItems(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const businessAddress = await SiteSettingsModel.getValue('business_address') || '11483 S Wexford Way, South Jordan, UT 84009';
    const businessPhone = await SiteSettingsModel.getValue('business_phone') || '(801) 448-6396';

    const html = generateOrderReceiptHTML(order, businessAddress, businessPhone);

    const baseUrl = getBaseUrl(request);
    const receiptUrl = `${baseUrl}/api/orders/${id}/receipt`;

    const defaultSubject = `Receipt From Payoff Solar — Order #${order.id.substring(0,8)}`;
    const subject = (subjectOverride && subjectOverride.trim()) ? subjectOverride.trim() : defaultSubject;
    let text = `View your receipt: ${receiptUrl}`;
    let emailHtml = `<p>Hi ${order.contact_name || ''},</p><p>Your receipt is available here: <a href="${receiptUrl}">${receiptUrl}</a></p><p>A PDF copy is attached.</p><p>Thank you!<br/>Payoff Solar</p>`;
    if (bodyOverride && bodyOverride.trim()) {
      text = bodyOverride;
      const safeHtml = bodyOverride
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
      emailHtml = `<div>${safeHtml}</div>`;
    }

    let sendOk = false;
    try {
      const pdf = await generatePdfFromHtml(html);
      sendOk = await sendEmailWithAttachment({
        to,
        subject,
        html: emailHtml,
        text: `View your receipt: ${receiptUrl}`,
        attachments: [
          { filename: `receipt-${order.id.substring(0,8)}.pdf`, contentType: 'application/pdf', content: pdf }
        ]
      });
      if (!sendOk) {
        console.warn('sendEmailWithAttachment returned false; falling back to link-only email');
        sendOk = await sendEmail({ to, subject, html: emailHtml, text: `View your receipt: ${receiptUrl}` });
      }
    } catch (e) {
      console.error('Error generating/sending receipt email:', e);
      sendOk = await sendEmail({ to, subject, html: emailHtml, text: `View your receipt: ${receiptUrl}` });
    }

    if (!sendOk) return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });

    try {
      const emailId = await trackOutboundEmail({
        contactId,
        fromEmail: process.env.SES_FROM_EMAIL || 'noreply@payoffsolar.com',
        toEmail: to,
        subject,
        bodyText: text,
        bodyHtml: emailHtml
      });
      return NextResponse.json({ success: true, emailId });
    } catch (trackingError) {
      console.error('Error tracking receipt email:', trackingError);
      return NextResponse.json({ success: true, warning: 'Email sent but tracking failed' });
    }
  } catch (error) {
    console.error('Error sending receipt email:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

