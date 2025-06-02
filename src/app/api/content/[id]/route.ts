import { NextRequest, NextResponse } from 'next/server';
import { ContentModel, ContentTypeModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    
    const content = await ContentModel.getById(id);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if content exists
    const existingContent = await ContentModel.getById(id);
    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Validate required fields if provided
    if (data.title !== undefined && (!data.title || !data.title.trim())) {
      return NextResponse.json({ 
        error: 'Title cannot be empty' 
      }, { status: 400 });
    }

    if (data.slug !== undefined && (!data.slug || !data.slug.trim())) {
      return NextResponse.json({ 
        error: 'Slug cannot be empty' 
      }, { status: 400 });
    }

    // Validate content type if provided
    if (data.type_id !== undefined) {
      const contentType = await ContentTypeModel.getById(data.type_id);
      if (!contentType) {
        return NextResponse.json({ 
          error: 'Invalid content type' 
        }, { status: 400 });
      }
    }

    // Check if slug already exists (if changing slug)
    if (data.slug !== undefined && data.slug !== existingContent.slug) {
      const slugExists = await ContentModel.getBySlug(data.slug);
      if (slugExists) {
        return NextResponse.json({ 
          error: 'Slug already exists' 
        }, { status: 400 });
      }
    }

    // Update content
    await ContentModel.update(id, {
      title: data.title?.trim(),
      slug: data.slug?.trim(),
      content: data.content,
      type_id: data.type_id,
      published: data.published
    });

    const updatedContent = await ContentModel.getById(id);
    return NextResponse.json({ content: updatedContent });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Check if content exists
    const content = await ContentModel.getById(id);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    await ContentModel.delete(id);
    return NextResponse.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
