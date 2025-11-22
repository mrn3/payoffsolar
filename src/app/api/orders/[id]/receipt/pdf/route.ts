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

import { generateOrderReceiptHTML } from '../receipt/route';

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

