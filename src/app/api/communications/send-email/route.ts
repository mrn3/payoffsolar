import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { trackOutboundEmail } from '@/lib/communication/tracking';
import { z } from 'zod';

const sendEmailSchema = z.object({
  contactId: z.string().optional(),
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  text: z.string().optional(),
  html: z.string().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendEmailSchema.parse(body);

    // Ensure we have either text or html content
    if (!validatedData.text && !validatedData.html) {
      return NextResponse.json(
        { error: 'Either text or html content is required' },
        { status: 400 }
      );
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'matt@payoffsolar.com';

    // Send the email
    const success = await sendEmail({
      to: validatedData.to,
      subject: validatedData.subject,
      text: validatedData.text,
      html: validatedData.html,
      cc: validatedData.cc,
      bcc: validatedData.bcc
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Track the email communication
    try {
      const emailId = await trackOutboundEmail({
        contactId: validatedData.contactId,
        fromEmail,
        toEmail: validatedData.to,
        ccEmails: validatedData.cc,
        bccEmails: validatedData.bcc,
        subject: validatedData.subject,
        bodyText: validatedData.text,
        bodyHtml: validatedData.html
      });

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        emailId
      });
    } catch (trackingError) {
      console.error('Error tracking email:', trackingError);
      // Email was sent successfully, but tracking failed
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully (tracking failed)',
        warning: 'Communication tracking failed'
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    
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
