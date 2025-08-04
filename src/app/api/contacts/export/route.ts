import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const zip = searchParams.get('zip') || '';

    let contacts;

    // Check if any filters are applied
    const hasFilters = search || city || state || zip;

    if (hasFilters) {
      const filters = {
        ...(search && { search }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zip && { zip })
      };
      // Get all contacts with filters (no limit for export)
      contacts = await ContactModel.getWithFilters(filters, 10000, 0);
    } else {
      // Get all contacts (no limit for export)
      contacts = await ContactModel.getAll(10000, 0);
    }

    // Generate CSV content
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Address',
      'City',
      'State',
      'Zip',
      'Notes',
      'Created At',
      'Display Name <Email>'
    ];

    const csvRows = [
      headers.join(','),
      ...contacts.map(contact => {
        // Create the special "Display Name <email>" field
        const displayNameEmail = contact.email 
          ? `"${contact.name} <${contact.email}>"`
          : `"${contact.name}"`;

        return [
          `"${contact.name || ''}"`,
          `"${contact.email || ''}"`,
          `"${contact.phone || ''}"`,
          `"${contact.address || ''}"`,
          `"${contact.city || ''}"`,
          `"${contact.state || ''}"`,
          `"${contact.zip || ''}"`,
          `"${(contact.notes || '').replace(/"/g, '""')}"`, // Escape quotes in notes
          `"${new Date(contact.created_at).toLocaleDateString()}"`,
          displayNameEmail
        ].join(',');
      })
    ];

    const csvContent = csvRows.join('\n');

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `contacts-export-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
