import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { TaskModel } from '@/lib/models';

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
    const task = await TaskModel.getById(id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
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

    // Check if task exists
    const existingTask = await TaskModel.getById(id);
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Validate required fields
    if (data.title !== undefined && !data.title.trim()) {
      return NextResponse.json({ error: 'Task title cannot be empty' }, { status: 400 });
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

    if (data.actual_hours !== undefined && data.actual_hours !== null && data.actual_hours < 0) {
      return NextResponse.json({ error: 'Actual hours cannot be negative' }, { status: 400 });
    }

    await TaskModel.update(id, {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigned_to: data.assigned_to,
      start_date: data.start_date,
      due_date: data.due_date,
      estimated_hours: data.estimated_hours,
      actual_hours: data.actual_hours,
      sort_order: data.sort_order
    });

    const updatedTask = await TaskModel.getById(id);
    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
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

    // Check if task exists
    const existingTask = await TaskModel.getById(id);
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await TaskModel.delete(id);
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
