import { NextRequest, NextResponse } from 'next/server';
import { SiteSettingsModel } from '@/lib/models';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const publicOnly = request.nextUrl.searchParams.get('public') === 'true';
    if (publicOnly) {
      const settings = await SiteSettingsModel.getPublic();
      const setting = settings.find((candidate) => candidate.setting_key === key);
      if (!setting) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }
      return NextResponse.json({ setting });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const setting = await SiteSettingsModel.getByKey(key);

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { key } = await params;
    const data = await request.json();

    // Check if setting exists
    const existing = await SiteSettingsModel.getByKey(key);
    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Update setting
    await SiteSettingsModel.update(key, {
      setting_value: data.setting_value !== undefined ? data.setting_value : undefined,
      setting_type: data.setting_type || undefined,
      description: data.description !== undefined ? data.description : undefined,
      is_public: data.is_public !== undefined ? Boolean(data.is_public) : undefined
    });

    const updatedSetting = await SiteSettingsModel.getByKey(key);
    return NextResponse.json({ 
      message: 'Setting updated successfully',
      setting: updatedSetting 
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { key } = await params;

    // Check if setting exists
    const existing = await SiteSettingsModel.getByKey(key);
    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Delete setting
    await SiteSettingsModel.delete(key);

    return NextResponse.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
