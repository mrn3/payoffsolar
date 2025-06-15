import { NextRequest, NextResponse } from 'next/server';
import { requireAuth , isAdmin} from '@/lib/auth';
import { ContactModel } from '@/lib/models';
import { getStateCode } from '@/lib/utils/states';
import { isValidPhoneNumber } from '@/lib/utils/phone';

interface ImportContact {
  name?: string;
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

    const { contacts } = await request.json();

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i] as ImportContact;
      
      try {
        // Validate required fields
        if (!contact.name || !contact.name.trim()) {
          throw new Error(`Row ${i + 1}: Name is required`);
        }

        const fullName = contact.name.trim();

        // Validate email format if provided
        if (contact.email && contact.email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(contact.email)) {
            throw new Error(`Row ${i + 1}: Invalid email format`);
          }
        }

        // Validate phone format if provided
        if (contact.phone && contact.phone.trim() && !isValidPhoneNumber(contact.phone)) {
          throw new Error(`Row ${i + 1}: Phone number must be 10 digits or 11 digits with +1`);
        }

        // Normalize state to state code if it's a full state name
        let normalizedState = contact.state?.trim() || '';
        if (normalizedState) {
          // If it's already a 2-letter code, keep it as is
          if (normalizedState.length === 2) {
            normalizedState = normalizedState.toUpperCase();
          } else {
            // Try to convert full state name to code
            const stateCode = getStateCode(normalizedState);
            if (stateCode) {
              normalizedState = stateCode;
            }
            // If we can't find a matching code, keep the original value
          }
        }

        // Create contact
        await ContactModel.create({
          name: fullName,
          email: contact.email?.trim() || '',
          phone: contact.phone?.trim() || '',
          address: contact.address?.trim() || '',
          city: contact.city?.trim() || '',
          state: normalizedState,
          zip: contact.zip?.trim() || '',
          notes: contact.notes?.trim() || null,
          user_id: null
        });

        successCount++;
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : `Row ${i + 1}: Unknown error`;
        errors.push(errorMessage);
        console.error(`Error importing contact at row ${i + 1}:`, error);
      }
    }

    return NextResponse.json({
      success: successCount,
      errors: errorCount,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Error in bulk contact import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
