import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { listingService } from '@/lib/services/listing';

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await listingService.syncListingStatuses(session.profile.id);

    return NextResponse.json({ 
      message: 'All listing statuses synced successfully' 
    });

  } catch (error) {
    console.error('Error syncing all listing statuses:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
