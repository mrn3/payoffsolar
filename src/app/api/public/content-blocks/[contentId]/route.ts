import { NextRequest, NextResponse } from 'next/server';
import { ContentBlockModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{ contentId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;
    const blocks = await ContentBlockModel.getByContentId(contentId);

    // Only return published content blocks (we could add a published field to blocks if needed)
    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('Error fetching content blocks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
