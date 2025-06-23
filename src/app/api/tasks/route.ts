import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { TaskModel } from '@/lib/models';

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
    const projectId = searchParams.get('project_id');
    const assignedTo = searchParams.get('assigned_to');

    const offset = (page - 1) * limit;

    let tasks;
    if (projectId) {
      tasks = await TaskModel.getByProjectId(projectId);
    } else if (assignedTo) {
      tasks = await TaskModel.getByAssignedUser(assignedTo);
    } else {
      tasks = await TaskModel.getAll(limit, offset);
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
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
    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    if (!data.project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Validate dates if provided
    if (data.start_date && data.due_date) {
      const startDate = new Date(data.start_date);
      const dueDate = new Date(data.due_date);
      if (startDate > dueDate) {
        return NextResponse.json({ error: 'Start date cannot be after due date' }, { status: 400 });
      }
    }

    // Validate hours if provided
    if (data.estimated_hours !== undefined && data.estimated_hours !== null && data.estimated_hours < 0) {
      return NextResponse.json({ error: 'Estimated hours cannot be negative' }, { status: 400 });
    }

    const taskId = await TaskModel.create({
      project_id: data.project_id,
      title: data.title,
      description: data.description,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      assigned_to: data.assigned_to,
      created_by: session.user.id,
      start_date: data.start_date,
      due_date: data.due_date,
      estimated_hours: data.estimated_hours,
      parent_task_id: data.parent_task_id,
      sort_order: data.sort_order || 0
    });

    const task = await TaskModel.getById(taskId);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
