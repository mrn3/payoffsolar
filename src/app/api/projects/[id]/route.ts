import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ProjectModel } from '@/lib/models';

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
    const project = await ProjectModel.getById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
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

    // Check if project exists
    const existingProject = await ProjectModel.getById(id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Validate required fields
    if (data.name !== undefined && !data.name.trim()) {
      return NextResponse.json({ error: 'Project name cannot be empty' }, { status: 400 });
    }

    // Validate dates if provided
    if (data.start_date && data.due_date) {
      const startDate = new Date(data.start_date);
      const dueDate = new Date(data.due_date);
      if (startDate > dueDate) {
        return NextResponse.json({ error: 'Start date cannot be after due date' }, { status: 400 });
      }
    }

    // Validate budget if provided
    if (data.budget !== undefined && data.budget !== null && data.budget < 0) {
      return NextResponse.json({ error: 'Budget cannot be negative' }, { status: 400 });
    }

    // Set completion date when marking as completed
    if (data.status === 'completed' && existingProject.status !== 'completed') {
      data.completion_date = new Date().toISOString().split('T')[0];
    }

    await ProjectModel.update(id, {
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      start_date: data.start_date,
      due_date: data.due_date,
      completion_date: data.completion_date,
      budget: data.budget,
      owner_id: data.owner_id
    });

    const updatedProject = await ProjectModel.getById(id);
    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
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

    // Check if project exists
    const existingProject = await ProjectModel.getById(id);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await ProjectModel.delete(id);
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
