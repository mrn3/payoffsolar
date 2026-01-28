import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { z } from 'zod';
import { isValidPhoneNumber } from '@/lib/utils/phone';
import { sendEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().refine(isValidPhoneNumber, 'Phone number must be 10 digits or 11 digits with +1'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();

    // Validate the request body
    const validatedData = contactSchema.parse(body);

	    // Create a new contact record (always record the lead even if email fails)
	    await ContactModel.create({
	      name: validatedData.name,
	      email: validatedData.email,
	      phone: validatedData.phone,
	      notes: `Subject: ${validatedData.subject}\n\n${validatedData.message}`,
	      address: validatedData.address ?? '',
	      city: validatedData.city ?? '',
	      state: validatedData.state ?? '',
	      zip: validatedData.zip ?? '',
	    });

    // Notify Matt by email
    const notifyTo = process.env.CONTACT_NOTIFY_EMAIL || 'matt@payoffsolar.com';
    const subject = `New Website Inquiry: ${validatedData.subject}`;
    const safeMessage = validatedData.message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const html = `<!doctype html><html><body>
      <div style="font-family:Arial,sans-serif;">
        <h2 style="margin:0 0 12px 0;">New Website Inquiry</h2>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Phone:</strong> ${validatedData.phone}</p>
        <p><strong>Subject:</strong> ${validatedData.subject}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;" />
        <p style="white-space:pre-wrap;">${safeMessage}</p>
      </div>
    </body></html>`;

    const sent = await sendEmail({
      to: notifyTo,
      subject,
      html,
    });

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Contact form submitted successfully' },
      { status: 200 }
    );
  } catch (_error) {
    console.error('Contact form _error:', _error);

    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: _error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
