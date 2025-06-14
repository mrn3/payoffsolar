import { NextRequest, NextResponse } from 'next/server';
import { ContentModel, ContentTypeModel } from '@/lib/models';
import {requireAuth, isAdmin} from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;
    
    const content = await ContentModel.getById(_id);
    if (!content) {
      return NextResponse.json({ _error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (_error) {
    console.error('Error fetching content:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;
    
    // Check if content exists
    const existingContent = await ContentModel.getById(_id);
    if (!existingContent) {
      return NextResponse.json({ _error: 'Content not found' }, { status: 404 });
    }

    // Validate required fields if provided
    if (_data.title !== undefined && (!data.title || !data.title.trim())) {
      return NextResponse.json({ 
        _error: 'Title cannot be empty' }, { status: 400 });
    }

    if (_data.slug !== undefined && (!data.slug || !data.slug.trim())) {
      return NextResponse.json({ 
        _error: 'Slug cannot be empty' }, { status: 400 });
    }

    // Validate content type if provided
    if (_data.type_id !== undefined) {
      const contentType = await ContentTypeModel.getById(_data.type_id);
      if (!contentType) {
        return NextResponse.json({ 
          _error: 'Invalid content type' }, { status: 400 });
      }
    }

    // Check if slug already exists (if changing slug)
    if (_data.slug !== undefined && data.slug !== existingContent.slug) {
      const slugExists = await ContentModel.getBySlug(_data.slug);
      if (slugExists) {
        return NextResponse.json({ 
          _error: 'Slug already exists' }, { status: 400 });
      }
    }

    // Update content
    await ContentModel.update(_id, {
      title: data.title?.trim(),
      slug: data.slug?.trim(),
      content: data.content,
      type_id: data.type_id,
      published: data.published
    });

    const updatedContent = await ContentModel.getById(_id);
    return NextResponse.json({ content: updatedContent });
  } catch (_error) {
    console.error('Error updating content:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;

    // Check if content exists
    const content = await ContentModel.getById(_id);
    if (!content) {
      return NextResponse.json({ _error: 'Content not found' }, { status: 404 });
    }

    await ContentModel.delete(_id);
    return NextResponse.json({ message: 'Content deleted successfully' });
  } catch (_error) {
    console.error('Error deleting content:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
