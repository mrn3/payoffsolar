import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete all contacts
    const deletedCount = await ContactModel.deleteAll();

    return NextResponse.json({ 
      message: `Successfully deleted ${deletedCount} contacts`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error deleting all contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
