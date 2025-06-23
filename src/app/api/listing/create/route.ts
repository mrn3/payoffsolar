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

    const data = await request.json();

    // Validate required fields
    if (!data.productId || !data.platformIds || !Array.isArray(data.platformIds)) {
      return NextResponse.json({ 
        error: 'Product ID and platform IDs are required' 
      }, { status: 400 });
    }

    const result = await listingService.createListings({
      productId: data.productId,
      platformIds: data.platformIds,
      templateIds: data.templateIds,
      customData: data.customData
    }, session.profile.id);

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Error creating listings:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
