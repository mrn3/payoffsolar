import React from 'react';
import { requireAuth, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TaskModel } from '@/lib/models';
import TaskForm from '@/components/tasks/TaskForm';

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;

  let task = null;
  let error = '';

  try {
    task = await TaskModel.getById(id);
    if (!task) {
      redirect('/dashboard/projects');
      return;
    }
  } catch (err) {
    console.error('Error loading task:', err);
    error = 'Failed to load task';
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Task</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update task details and assignment.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <TaskForm task={task!} />
      </div>
    </div>
  );
}
