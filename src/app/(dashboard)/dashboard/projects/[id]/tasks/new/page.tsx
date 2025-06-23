import React from 'react';
import { requireAuth, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProjectModel } from '@/lib/models';
import TaskForm from '@/components/tasks/TaskForm';

interface NewTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewTaskPage({ params }: NewTaskPageProps) {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  const { id: projectId } = await params;

  // Verify project exists
  const project = await ProjectModel.getById(projectId);
  if (!project) {
    redirect('/dashboard/projects');
    return;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Task</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create a new task for project: <span className="font-medium">{project.name}</span>
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <TaskForm projectId={projectId} />
      </div>
    </div>
  );
}
