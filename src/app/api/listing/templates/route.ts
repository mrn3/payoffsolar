import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ListingTemplateModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');

    const templates = platformId 
      ? await ListingTemplateModel.getByPlatformId(platformId)
      : await ListingTemplateModel.getAll();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching listing templates:', error);
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
    if (!data.platform_id || !data.name) {
      return NextResponse.json({ 
        error: 'Platform ID and name are required' 
      }, { status: 400 });
    }

    const templateId = await ListingTemplateModel.create({
      platform_id: data.platform_id,
      name: data.name,
      title_template: data.title_template || null,
      description_template: data.description_template || null,
      category_mapping: data.category_mapping || {},
      price_adjustment_type: data.price_adjustment_type || 'none',
      price_adjustment_value: data.price_adjustment_value || 0,
      shipping_template: data.shipping_template || null,
      is_default: data.is_default || false,
      is_active: data.is_active !== undefined ? data.is_active : true
    });

    return NextResponse.json({ 
      message: 'Template created successfully',
      templateId 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating listing template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
