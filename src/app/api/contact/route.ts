import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().refine(isValidPhoneNumber, 'Phone number must be 10 digits or 11 digits with +1'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();
    
    // Validate the request body
    const validatedData = contactSchema.parse(body);
    
    // Create a new contact record
    await ContactModel.create({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      notes: `Subject: ${validatedData.subject}\n\n${validatedData.message}`,
      address: '',
      city: '',
      state: '',
      zip: '',
    });
    
    return NextResponse.json(
      { message: 'Contact form submitted successfully' },
      { status: 200 }
    );
  } catch (_error) {
    console.error('Contact form _error:', _error);
    
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { _error: 'Validation error', details: _error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { _error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
