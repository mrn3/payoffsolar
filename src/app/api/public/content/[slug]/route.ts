import { NextRequest, NextResponse } from 'next/server';
import { ContentModel } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const content = await ContentModel.getBySlug(slug);
    if (!content || !content.published) {
      return NextResponse.json({ _error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (_error) {
    console.error('Error fetching public content by slug:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
