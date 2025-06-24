import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ListingPlatformModel, PlatformCredentialsModel } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const platform = await ListingPlatformModel.getById(id);
    if (!platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    // Get user's credentials for this platform
    const credentials = await PlatformCredentialsModel.getByUserAndPlatform(
      session.profile.id,
      id
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    // Parse configuration if it's a string
    let configuration = data.configuration;
    if (typeof configuration === 'string') {
      try {
        configuration = JSON.parse(configuration);
      } catch (e) {
        // If parsing fails, keep as string
      }
    }

    // Update platform settings
    await ListingPlatformModel.update(id, {
      display_name: data.display_name,
      api_endpoint: data.api_endpoint,
      requires_auth: data.requires_auth,
      is_active: data.is_active,
      configuration: configuration
    });

    // Update credentials if provided
    if (data.credentials && typeof data.credentials === 'object') {
      // Filter out any non-credential fields that might have been corrupted
      const credentialFields = ['accessToken', 'pageId', 'appId', 'devId', 'certId', 'userToken',
                               'accessKeyId', 'secretAccessKey', 'sellerId', 'marketplaceId', 'region',
                               'username', 'password', 'email'];

      const cleanCredentials: Record<string, any> = {};
      for (const field of credentialFields) {
        if (data.credentials[field] !== undefined) {
          cleanCredentials[field] = data.credentials[field];
        }
      }

      // Check if any credential values are non-empty
      const hasNonEmptyCredentials = Object.values(cleanCredentials).some(value =>
        value !== null && value !== undefined && value !== ''
      );

      if (hasNonEmptyCredentials) {
        // Save/update credentials
        await PlatformCredentialsModel.upsert({
          platform_id: id,
          user_id: session.profile.id,
          credential_type: 'api_key', // Default type, could be made configurable
          credentials: cleanCredentials,
          is_active: true
        });
      } else {
        // All credentials are empty, delete existing credentials
        await PlatformCredentialsModel.delete(session.profile.id, id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating platform:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await ListingPlatformModel.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting platform:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
