import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ListingPlatformModel, PlatformCredentialsModel } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const platform = await ListingPlatformModel.getById(params.id);
    if (!platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    // Get user's credentials for this platform
    const credentials = await PlatformCredentialsModel.getByUserAndPlatform(
      session.profile.id,
      params.id
    );

    return NextResponse.json({
      platform: {
        ...platform,
        credentials: credentials?.credentials || {}
      }
    });
  } catch (error) {
    console.error('Error fetching platform:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Update platform settings
    await ListingPlatformModel.update(params.id, {
      display_name: data.display_name,
      api_endpoint: data.api_endpoint,
      requires_auth: data.requires_auth,
      is_active: data.is_active,
      configuration: data.configuration
    });

    // Update credentials if provided
    if (data.credentials && Object.keys(data.credentials).length > 0) {
      await PlatformCredentialsModel.upsert({
        platform_id: params.id,
        user_id: session.profile.id,
        credential_type: 'api_key', // Default type, could be made configurable
        credentials: data.credentials,
        is_active: true
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating platform:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const deleted = await ListingPlatformModel.delete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting platform:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
