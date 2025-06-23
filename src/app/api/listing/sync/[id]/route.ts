import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { listingService } from '@/lib/services/listing';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    await listingService.syncListingStatuses(session.profile.id, id);

    return NextResponse.json({ 
      message: 'Listing statuses synced successfully' 
    });

  } catch (error) {
    console.error('Error syncing listing statuses:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
