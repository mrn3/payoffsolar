import { NextRequest, NextResponse } from 'next/server';
import { ContentModel, ContentTypeModel } from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const typeId = searchParams.get('type_id') || '';
    const offset = (page - 1) * limit;

    let content;
    let total;

    if (search) {
      content = await ContentModel.search(search, limit, offset);
      // For search, we'll use a simple count - in production you might want a more accurate count
      total = content.length;
    } else if (typeId) {
      content = await ContentModel.getByType(typeId, limit, offset);
      total = await ContentModel.getCountByType(typeId);
    } else {
      content = await ContentModel.getAll(limit, offset);
      total = await ContentModel.getCount();
    }

    return NextResponse.json({
      content,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (_error) {
    console.error('Error fetching content:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const data = await _request.json();

    // Validate required fields
    if (!data.title || !data.title.trim()) {
      return NextResponse.json({
        _error: 'Title is required' }, { status: 400 });
    }

    if (!data.slug || !data.slug.trim()) {
      return NextResponse.json({
        _error: 'Slug is required' }, { status: 400 });
    }

    if (!data.type_id || !data.type_id.trim()) {
      return NextResponse.json({
        _error: 'Content type is required' }, { status: 400 });
    }

    // Validate content type exists
    const contentType = await ContentTypeModel.getById(data.type_id);
    if (!contentType) {
      return NextResponse.json({
        _error: 'Invalid content type' }, { status: 400 });
    }

    // Check if slug already exists
    const existingContent = await ContentModel.getBySlug(data.slug);
    if (existingContent) {
      return NextResponse.json({
        _error: 'Slug already exists' }, { status: 400 });
    }

    const contentId = await ContentModel.create({
      title: data.title.trim(),
      slug: data.slug.trim(),
      content: data.content || '',
      content_mode: data.content_mode || 'rich_text',
      image_url: data.image_url || null,
      type_id: data.type_id,
      published: data.published || false,
      published_date: data.published_date || null,
      author_id: session.profile.id
    });

    const newContent = await ContentModel.getById(contentId);
    return NextResponse.json({ content: newContent }, { status: 201 });
  } catch (_error) {
    console.error('Error creating content:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
