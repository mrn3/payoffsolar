import { NextRequest, NextResponse } from 'next/server';
import { ContentBlockModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    const blocks = await ContentBlockModel.getByContentId(contentId);
    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('Error fetching content blocks:', error);
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
    if (!data.content_id || !data.block_type_id || data.block_order === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: content_id, block_type_id, block_order'
      }, { status: 400 });
    }

    const blockId = await ContentBlockModel.create({
      content_id: data.content_id,
      block_type_id: data.block_type_id,
      block_order: data.block_order,
      configuration: data.configuration || {}
    });

    const block = await ContentBlockModel.getById(blockId);
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    console.error('Error creating content block:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    await ContentBlockModel.deleteByContentId(contentId);
    return NextResponse.json({ message: 'Content blocks deleted successfully' });
  } catch (error) {
    console.error('Error deleting content blocks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
