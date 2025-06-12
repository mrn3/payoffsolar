import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { findDuplicates } from '@/lib/utils/duplicates';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold') || '70');

    // Get all contacts for duplicate detection
    const allContacts = await ContactModel.getAll(10000, 0); // Get a large number to include all contacts
    
    // Find duplicates
    const duplicateGroups = findDuplicates(allContacts, threshold);

    return NextResponse.json({ 
      duplicateGroups,
      totalGroups: duplicateGroups.length,
      totalDuplicateContacts: duplicateGroups.reduce((sum, group) => sum + group.contacts.length, 0)
    });
  } catch (error) {
    console.error('Error finding duplicate contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
