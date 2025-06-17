import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

interface BulkUpdateRequest {
  contactIds: string[];
  updateData: {
    city?: string;
    state?: string;
    zip?: string;
    notes?: string;
  };
}

export async function PATCH(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { contactIds, updateData }: BulkUpdateRequest = await request.json();

    // Validate input
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({
        error: 'Contact IDs array is required and must not be empty'
      }, { status: 400 });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: 'Update data is required'
      }, { status: 400 });
    }

    // Validate that we only have allowed fields
    const allowedFields = ['city', 'state', 'zip', 'notes'];
    const providedFields = Object.keys(updateData);
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return NextResponse.json({
        error: `Invalid fields: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`
      }, { status: 400 });
    }

    // Update each contact
    let updatedCount = 0;
    const errors: string[] = [];

    for (const contactId of contactIds) {
      try {
        // Verify contact exists
        const contact = await ContactModel.getById(contactId);
        if (!contact) {
          errors.push(`Contact with ID ${contactId} not found`);
          continue;
        }

        // Update the contact
        await ContactModel.update(contactId, updateData);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating contact ${contactId}:`, error);
        errors.push(`Failed to update contact ${contactId}`);
      }
    }

    const response: any = {
      message: `Successfully updated ${updatedCount} contact${updatedCount !== 1 ? 's' : ''}`,
      updatedCount,
      totalRequested: contactIds.length
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.partialSuccess = true;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
