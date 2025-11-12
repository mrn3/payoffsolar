import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isContact } from '@/lib/auth';
import { OrderModel, InvoiceModel } from '@/lib/models';
import { trackOutboundSMS } from '@/lib/communication/tracking';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export const runtime = 'nodejs';

const BodySchema = z.object({
  to: z.string().min(10, 'Invalid phone number'),
  contactId: z.string().optional()
});

function getBaseUrl(req: NextRequest) {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function toE164(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) {
    // Basic sanity check: + followed by 10-15 digits
    const digits = trimmed.slice(1).replace(/[^0-9]/g, '');
    return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
  }
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `+1${digits}`; // Assume US if 10 digits
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (isContact(session.profile.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { to, contactId } = BodySchema.parse(body);

    const order = await OrderModel.getWithItems(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    let invoice = await InvoiceModel.getByOrderId(id);
    if (!invoice) {
      const invoiceId = await InvoiceModel.createFromOrder(id);
      invoice = await InvoiceModel.getById(invoiceId);
    }
    if (!invoice) return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });

    const baseUrl = getBaseUrl(request);
    const invoiceUrl = `${baseUrl}/api/orders/${id}/invoice`;

    const fromPhone = process.env.SNS_FROM_PHONE || process.env.TWILIO_PHONE_NUMBER || '+18014486396';
    const message = `Payoff Solar invoice ${invoice.invoice_number}: ${invoiceUrl}`;

    const e164 = toE164(to);
    if (!e164) {
      return NextResponse.json({ error: 'Please provide a valid phone number (e.g., +18015551234)' }, { status: 400 });
    }

    // Initialize SNS client
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';
    let provider = 'sns';
    let providerMessageId: string | undefined;

    try {
      const sns = new SNSClient({ region });
      const msgAttrs: Record<string, { DataType: string; StringValue: string }> = {
        'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: process.env.AWS_SNS_DEFAULT_SMS_TYPE || 'Transactional' }
      };
      const senderId = process.env.AWS_SNS_SENDER_ID;
      if (senderId) {
        msgAttrs['AWS.SNS.SMS.SenderID'] = { DataType: 'String', StringValue: senderId };
      }

      const publishRes = await sns.send(new PublishCommand({
        PhoneNumber: e164,
        Message: message,
        MessageAttributes: msgAttrs
      }));
      providerMessageId = publishRes.MessageId;
    } catch (sendErr) {
      console.error('SNS send failed, falling back to simulated SMS:', sendErr);
      provider = 'simulated';
      // Simulate SMS sending (console log)
      console.log(`Simulated SMS to ${e164}: ${message}`);
    }

    try {
      const smsId = await trackOutboundSMS({
        contactId,
        fromPhone,
        toPhone: e164,
        messageText: message,
        provider,
        providerMessageId
      });
      return NextResponse.json({ success: true, smsId, provider, providerMessageId });
    } catch (trackingError) {
      console.error('Error tracking invoice SMS:', trackingError);
      return NextResponse.json({ success: true, warning: 'SMS sent but tracking failed', provider, providerMessageId });
    }
  } catch (error) {
    console.error('Error sending invoice SMS:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

