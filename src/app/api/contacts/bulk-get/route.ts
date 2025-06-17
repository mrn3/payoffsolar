import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

interface BulkGetRequest {
  contactIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { contactIds }: BulkGetRequest = await request.json();

    // Validate input
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({
        error: 'Contact IDs array is required and must not be empty'
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

    const response: any = {
      contacts,
      totalContacts: contacts.length,
      requestedCount: contactIds.length
    };

    if (notFoundIds.length > 0) {
      response.notFoundIds = notFoundIds;
      response.warning = `${notFoundIds.length} contact${notFoundIds.length !== 1 ? 's' : ''} could not be found`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in bulk get contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
