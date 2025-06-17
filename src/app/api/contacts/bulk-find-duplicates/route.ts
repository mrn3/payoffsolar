import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { findDuplicates } from '@/lib/utils/duplicates';

interface BulkFindDuplicatesRequest {
  contactIds: string[];
  threshold?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { contactIds, threshold = 70 }: BulkFindDuplicatesRequest = await request.json();

    // Validate input
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({
        error: 'Contact IDs array is required and must not be empty'
      }, { status: 400 });
    }

    if (contactIds.length < 2) {
      return NextResponse.json({
        duplicateGroups: [],
        totalGroups: 0,
        totalDuplicateContacts: 0,
        message: 'At least 2 contacts are required to find duplicates'
      });
    }

    // Validate threshold
    if (threshold < 0 || threshold > 100) {
      return NextResponse.json({
        error: 'Threshold must be between 0 and 100'
      }, { status: 400 });
    }

    // Fetch the selected contacts
    const contacts = [];
    const notFoundIds = [];

    for (const contactId of contactIds) {
      try {
        const contact = await ContactModel.getById(contactId);
        if (contact) {
          contacts.push(contact);
        } else {
          notFoundIds.push(contactId);
        }
      } catch (error) {
        console.error(`Error fetching contact ${contactId}:`, error);
        notFoundIds.push(contactId);
      }
    }

    if (contacts.length < 2) {
      return NextResponse.json({
        duplicateGroups: [],
        totalGroups: 0,
        totalDuplicateContacts: 0,
        message: 'Not enough valid contacts found to check for duplicates',
        notFoundIds
      });
    }

    // Find duplicates among the selected contacts
    const duplicateGroups = findDuplicates(contacts, threshold);

    const response: any = {
      duplicateGroups,
      totalGroups: duplicateGroups.length,
      totalDuplicateContacts: duplicateGroups.reduce((sum, group) => sum + group.contacts.length, 0),
      totalContactsChecked: contacts.length,
      threshold
    };

    if (notFoundIds.length > 0) {
      response.notFoundIds = notFoundIds;
      response.warning = `${notFoundIds.length} contact${notFoundIds.length !== 1 ? 's' : ''} could not be found`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in bulk find duplicates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
