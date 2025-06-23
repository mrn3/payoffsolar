import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { ProjectModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    let projects;
    if (status) {
      projects = await ProjectModel.getByStatus(status);
    } else {
      projects = await ProjectModel.getAll(limit, offset);
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
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
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
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

    const projectId = await ProjectModel.create({
      name: data.name,
      description: data.description,
      status: data.status || 'planning',
      priority: data.priority || 'medium',
      start_date: data.start_date,
      due_date: data.due_date,
      budget: data.budget,
      owner_id: data.owner_id,
      created_by: session.user.id
    });

    const project = await ProjectModel.getById(projectId);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
