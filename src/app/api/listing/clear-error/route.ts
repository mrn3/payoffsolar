import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ProductListingModel } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.productId || !data.platformId) {
      return NextResponse.json({ 
        error: 'Product ID and Platform ID are required' 
      }, { status: 400 });
    }

    // Find the existing listing
    const existingListing = await ProductListingModel.getByProductAndPlatform(
      data.productId, 
      data.platformId
    );

    if (!existingListing) {
      return NextResponse.json({ 
        error: 'Listing not found' 
      }, { status: 404 });
    }

    // Delete the listing record to reset it to "not_listed" state
    await ProductListingModel.delete(existingListing.id);

    return NextResponse.json({ 
      success: true,
      message: 'Error cleared and listing reset to not listed state'
    });

  } catch (error) {
    console.error('Error clearing listing error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
