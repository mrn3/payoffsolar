import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ListingTemplateModel } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const template = await ListingTemplateModel.getById(params.id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Check if template exists
    const existingTemplate = await ListingTemplateModel.getById(params.id);
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Validate required fields
    if (data.name !== undefined && !data.name.trim()) {
      return NextResponse.json({ error: 'Template name cannot be empty' }, { status: 400 });
    }

    // Update template
    await ListingTemplateModel.update(params.id, {
      platform_id: data.platform_id,
      name: data.name?.trim(),
      title_template: data.title_template || null,
      description_template: data.description_template || null,
      category_mapping: data.category_mapping || {},
      price_adjustment_type: data.price_adjustment_type || 'none',
      price_adjustment_value: data.price_adjustment_value || 0,
      shipping_template: data.shipping_template || null,
      is_default: data.is_default || false,
      is_active: data.is_active !== undefined ? data.is_active : true
    });

    const updatedTemplate = await ListingTemplateModel.getById(params.id);
    return NextResponse.json({ 
      message: 'Template updated successfully',
      template: updatedTemplate 
    });

  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if template exists
    const existingTemplate = await ListingTemplateModel.getById(params.id);
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await ListingTemplateModel.delete(params.id);
    return NextResponse.json({ message: 'Template deleted successfully' });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
