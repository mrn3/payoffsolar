import { NextRequest, NextResponse } from 'next/server';
import { ContentBlockModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const block = await ContentBlockModel.getById(id);

    if (!block) {
      return NextResponse.json({ error: 'Content block not found' }, { status: 404 });
    }

    return NextResponse.json({ block });
  } catch (error) {
    console.error('Error fetching content block:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if block exists
    const existingBlock = await ContentBlockModel.getById(id);
    if (!existingBlock) {
      return NextResponse.json({ error: 'Content block not found' }, { status: 404 });
    }

    await ContentBlockModel.update(id, {
      block_type_id: data.block_type_id,
      block_order: data.block_order,
      configuration: data.configuration
    });

    const updatedBlock = await ContentBlockModel.getById(id);
    return NextResponse.json({ block: updatedBlock });
  } catch (error) {
    console.error('Error updating content block:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Check if block exists
    const existingBlock = await ContentBlockModel.getById(id);
    if (!existingBlock) {
      return NextResponse.json({ error: 'Content block not found' }, { status: 404 });
    }

    await ContentBlockModel.delete(id);
    return NextResponse.json({ message: 'Content block deleted successfully' });
  } catch (error) {
    console.error('Error deleting content block:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
