import { NextRequest, NextResponse } from 'next/server';
import { ContentModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || '';
    const offset = (page - 1) * limit;

    let content;
    let total;

    if (type) {
      // Get content by type name (convert type name to type_id)
      const { ContentTypeModel } = await import('@/lib/models');
      const contentType = await ContentTypeModel.getByName(type);
      if (!contentType) {
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
      }
      content = await ContentModel.getPublishedByType(contentType.id, limit, offset);
      total = await ContentModel.getCountByType(contentType.id);
    } else {
      content = await ContentModel.getPublished(limit, offset);
      total = await ContentModel.getPublishedCount();
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
  } catch (error) {
    console.error('Error fetching public content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
