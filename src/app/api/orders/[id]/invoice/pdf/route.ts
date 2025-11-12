import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { InvoiceModel } from '@/lib/models';

export const runtime = 'nodejs';

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch the HTML invoice (public) to ensure it's consistent with what customers see
    const baseUrl = getBaseUrl(request);
    const invoiceHtmlRes = await fetch(`${baseUrl}/api/orders/${id}/invoice`, { cache: 'no-store' });
    if (!invoiceHtmlRes.ok) {
      return NextResponse.json({ error: 'Failed to generate invoice HTML' }, { status: 500 });
    }
    const html = await invoiceHtmlRes.text();

    // Get invoice number for file name (may have been created by the HTML route)
    const invoice = await InvoiceModel.getByOrderId(id);
    const filename = invoice?.invoice_number ? `invoice-${invoice.invoice_number}.pdf` : `invoice-${id.substring(0, 8)}.pdf`;

    // Generate PDF
    const pdfBuffer = await generatePdfFromHtml(html);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

