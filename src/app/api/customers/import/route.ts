import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth/session';
import { CustomerModel } from '@/lib/models';
import { isValidPhoneNumber } from '@/lib/utils/validation';

interface ImportCustomer {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { customers } = await request.json();

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ error: 'No customers provided' }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i] as ImportCustomer;
      
      try {
        // Validate required fields
        if (!customer.first_name || !customer.first_name.trim()) {
          throw new Error(`Row ${i + 1}: First name is required`);
        }

        // Validate email format if provided
        if (customer.email && customer.email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(customer.email)) {
            throw new Error(`Row ${i + 1}: Invalid email format`);
          }
        }

        // Validate phone format if provided
        if (customer.phone && customer.phone.trim() && !isValidPhoneNumber(customer.phone)) {
          throw new Error(`Row ${i + 1}: Phone number must be exactly 10 digits`);
        }

        // Create customer
        await CustomerModel.create({
          first_name: customer.first_name.trim(),
          last_name: customer.last_name?.trim() || '',
          email: customer.email?.trim() || '',
          phone: customer.phone?.trim() || '',
          address: customer.address?.trim() || '',
          city: customer.city?.trim() || '',
          state: customer.state?.trim() || '',
          zip: customer.zip?.trim() || '',
          notes: customer.notes?.trim() || null,
          user_id: null
        });

        successCount++;
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : `Row ${i + 1}: Unknown error`;
        errors.push(errorMessage);
        console.error(`Error importing customer at row ${i + 1}:`, error);
      }
    }

    return NextResponse.json({
      success: successCount,
      errors: errorCount,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Error in bulk customer import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
