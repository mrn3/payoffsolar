import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ListingPlatformModel, PlatformCredentialsModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const platforms = activeOnly
      ? await ListingPlatformModel.getActive()
      : await ListingPlatformModel.getAll();

    // Add credentials for each platform for the current user
    const platformsWithCredentials = await Promise.all(
      platforms.map(async (platform) => {
        const credentials = await PlatformCredentialsModel.getByUserAndPlatform(
          session.profile.id,
          platform.id
        );
        return {
          ...platform,
          credentials: credentials?.credentials || {}
        };
      })
    );

    return NextResponse.json({ platforms: platformsWithCredentials });
  } catch (error) {
    console.error('Error fetching listing platforms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.display_name) {
      return NextResponse.json({ 
        error: 'Name and display name are required' 
      }, { status: 400 });
    }

    const platformId = await ListingPlatformModel.create({
      name: data.name,
      display_name: data.display_name,
      api_endpoint: data.api_endpoint || null,
      requires_auth: data.requires_auth !== undefined ? data.requires_auth : true,
      is_active: data.is_active !== undefined ? data.is_active : true,
      configuration: data.configuration || {}
    });

    return NextResponse.json({ 
      message: 'Platform created successfully',
      platformId 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating listing platform:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
