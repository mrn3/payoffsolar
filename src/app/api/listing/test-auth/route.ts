import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ListingPlatformModel, PlatformCredentialsModel } from '@/lib/models';
import { createPlatformService } from '@/lib/services/listing/base';

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.platformId) {
      return NextResponse.json({ 
        error: 'Platform ID is required' 
      }, { status: 400 });
    }

    // Fetch platform
    const platform = await ListingPlatformModel.getById(data.platformId);
    if (!platform) {
      return NextResponse.json({ 
        error: 'Platform not found' 
      }, { status: 404 });
    }

    // Fetch credentials
    const credentialsRecord = await PlatformCredentialsModel.getByUserAndPlatform(
      session.profile.id,
      data.platformId
    );

    if (!credentialsRecord) {
      return NextResponse.json({ 
        error: 'No credentials found for this platform' 
      }, { status: 400 });
    }

    // Create platform service
    const platformService = createPlatformService(platform, credentialsRecord.credentials);

    // Test authentication
    const isAuthenticated = await platformService.authenticate();

    return NextResponse.json({ 
      success: isAuthenticated,
      platform: platform.display_name,
      message: isAuthenticated 
        ? 'Authentication successful' 
        : 'Authentication failed - please check your credentials'
    });

  } catch (error) {
    console.error('Error testing platform authentication:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
