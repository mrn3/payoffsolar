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

    const { _searchParams } = new URL(_request.url);
    const page = parseInt(_searchParams.get('page') || '1');
    const limit = parseInt(_searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

    let content;
    let total;

    if (search) {
      content = await ContentModel.search(search, limit, offset);
      // For search, we'll use a simple count - in production you might want a more accurate count
      total = content.length;
    } else if (_typeId) {
      content = await ContentModel.getByType(_typeId, limit, offset);
      total = await ContentModel.getCountByType(_typeId);
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
    const contentType = await ContentTypeModel.getById(_data.type_id);
    if (!contentType) {
      return NextResponse.json({ 
        _error: 'Invalid content type' }, { status: 400 });
    }

    // Check if slug already exists
    const existingContent = await ContentModel.getBySlug(_data.slug);
    if (existingContent) {
      return NextResponse.json({ 
        _error: 'Slug already exists' }, { status: 400 });
    }

    const contentId = await ContentModel.create({
      title: data.title.trim(),
      slug: data.slug.trim(),
      content: data.content || '',
      type_id: data.type_id,
      published: data.published || false,
      author_id: session.profile.id
    });

    const newContent = await ContentModel.getById(contentId);
    return NextResponse.json({ content: newContent }, { status: 201 });
  } catch (_error) {
    console.error('Error creating content:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
