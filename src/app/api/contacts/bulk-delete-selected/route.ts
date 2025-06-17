import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

interface BulkDeleteRequest {
  contactIds: string[];
}

export async function DELETE(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { contactIds }: BulkDeleteRequest = await request.json();

    // Validate input
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({
        error: 'Contact IDs array is required and must not be empty'
      }, { status: 400 });
    }

    // Delete each contact
    let deletedCount = 0;
    const errors: string[] = [];

    for (const contactId of contactIds) {
      try {
        // Verify contact exists
        const contact = await ContactModel.getById(contactId);
        if (!contact) {
          errors.push(`Contact with ID ${contactId} not found`);
          continue;
        }

        // Delete the contact (this will also cascade delete orders due to foreign key constraint)
        await ContactModel.delete(contactId);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting contact ${contactId}:`, error);
        errors.push(`Failed to delete contact ${contactId}`);
      }
    }

    const response: any = {
      message: `Successfully deleted ${deletedCount} contact${deletedCount !== 1 ? 's' : ''}`,
      deletedCount,
      totalRequested: contactIds.length
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.partialSuccess = true;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
