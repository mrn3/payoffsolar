import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';
import { findDuplicates } from '@/lib/utils/duplicates';

export async function GET(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _searchParams } = new URL(_request.url);
    const threshold = parseInt(_searchParams.get('threshold') || '70');

    // Get all contacts for duplicate detection
    const allContacts = await ContactModel.getAll(10000, 0); // Get a large number to include all contacts
    
    // Find duplicates
    const duplicateGroups = findDuplicates(allContacts, threshold);

    return NextResponse.json({ 
      duplicateGroups,
      totalGroups: duplicateGroups.length,
      totalDuplicateContacts: duplicateGroups.reduce((sum, group) => sum + group.contacts.length, 0)
    });
  } catch (_error) {
    console.error('Error finding duplicate _contacts:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
