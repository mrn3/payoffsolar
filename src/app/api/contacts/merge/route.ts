import { NextRequest, NextResponse } from 'next/server';
import {ContactModel} from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';
import { executeSingle } from '@/lib/mysql/connection';
import { smartMergeContacts } from '@/lib/utils/duplicates';

interface MergeRequest {
  primaryContactId: string;
  duplicateContactId: string;
  mergedData?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    notes?: string;
    created_at?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { primaryContactId, duplicateContactId, mergedData }: MergeRequest = await request.json();

    // Validate input
    if (!primaryContactId || !duplicateContactId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (primaryContactId === duplicateContactId) {
      return NextResponse.json({ error: 'Cannot merge a contact with itself' }, { status: 400 });
    }

    // Verify both contacts exist
    const primaryContact = await ContactModel.getById(primaryContactId);
    const duplicateContact = await ContactModel.getById(duplicateContactId);

    if (!primaryContact || !duplicateContact) {
      return NextResponse.json({ error: 'One or both contacts not found' }, { status: 404 });
    }

    // Start transaction-like operations
    try {
      // 1. Update any orders that reference the duplicate contact to reference the primary contact
      await executeSingle(
        'UPDATE orders SET contact_id = ? WHERE contact_id = ? ',
        [primaryContactId, duplicateContactId]
      );

      // 2. Generate smart merged data if not provided
      const finalMergedData = mergedData || smartMergeContacts(primaryContact, duplicateContact);

      // 3. Update the primary contact with merged data (including created_at if provided)
      await ContactModel.updateForMerge(primaryContactId, {
        name: finalMergedData.name,
        email: finalMergedData.email,
        phone: finalMergedData.phone,
        address: finalMergedData.address,
        city: finalMergedData.city,
        state: finalMergedData.state,
        zip: finalMergedData.zip,
        notes: finalMergedData.notes,
        created_at: mergedData?.created_at || finalMergedData.created_at
      });

      // 4. Delete the duplicate contact
      await ContactModel.delete(duplicateContactId);

      // 5. Get the updated primary contact
      const updatedContact = await ContactModel.getById(primaryContactId);

      return NextResponse.json({ 
        success: true,
        mergedContact: updatedContact,
        message: 'Contacts merged successfully'
      });

    } catch (mergeError) {
      console.error('Error during merge operation:', mergeError);
      return NextResponse.json({
        error: 'Failed to merge contacts. Please try again.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error merging contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
