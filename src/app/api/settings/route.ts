import { NextRequest, NextResponse } from 'next/server';
import { SiteSettingsModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get('public') === 'true';

    if (publicOnly) {
      // Public settings don't require authentication
      const settings = await SiteSettingsModel.getPublic();
      return NextResponse.json({ settings });
    } else {
      // All settings require admin access
      const session = await requireAuth();
      if (!isAdmin(session.profile.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const settings = await SiteSettingsModel.getAll();
      return NextResponse.json({ settings });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
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
    if (!data.setting_key || typeof data.setting_key !== 'string' || data.setting_key.trim().length === 0) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    // Check if setting already exists
    const existing = await SiteSettingsModel.getByKey(data.setting_key.trim());
    if (existing) {
      return NextResponse.json({ error: 'Setting with this key already exists' }, { status: 400 });
    }

    // Create setting
    const settingId = await SiteSettingsModel.create({
      setting_key: data.setting_key.trim(),
      setting_value: data.setting_value || null,
      setting_type: data.setting_type || 'string',
      description: data.description?.trim() || null,
      is_public: data.is_public !== undefined ? Boolean(data.is_public) : false
    });

    const newSetting = await SiteSettingsModel.getByKey(data.setting_key.trim());
    return NextResponse.json({ 
      message: 'Setting created successfully',
      setting: newSetting 
    });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
