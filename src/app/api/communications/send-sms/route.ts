import { NextRequest, NextResponse } from 'next/server';
import { trackOutboundSMS } from '@/lib/communication/tracking';
import { z } from 'zod';

const sendSMSSchema = z.object({
  contactId: z.string().optional(),
  to: z.string().min(10, 'Invalid phone number'),
  message: z.string().min(1, 'Message is required').max(1600, 'Message too long')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendSMSSchema.parse(body);

    const fromPhone = process.env.TWILIO_PHONE_NUMBER || '+18014486396';

    // For now, we'll just track the SMS without actually sending it
    // In a real implementation, you would integrate with Twilio or another SMS provider
    
    // Simulate SMS sending
    console.log(`Simulating SMS send from ${fromPhone} to ${validatedData.to}: ${validatedData.message}`);
    
    // Track the SMS communication
    try {
      const smsId = await trackOutboundSMS({
        contactId: validatedData.contactId,
        fromPhone,
        toPhone: validatedData.to,
        messageText: validatedData.message,
        provider: 'simulated'
      });

      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully (simulated)',
        smsId
      });
    } catch (trackingError) {
      console.error('Error tracking SMS:', trackingError);
      return NextResponse.json(
        { error: 'Failed to track SMS communication' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
