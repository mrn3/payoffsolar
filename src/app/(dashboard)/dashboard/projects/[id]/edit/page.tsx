import React from 'react';
import { requireAuth, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProjectModel } from '@/lib/models';
import ProjectForm from '@/components/projects/ProjectForm';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;

  let project = null;
  let error = '';

  try {
    project = await ProjectModel.getById(id);
    if (!project) {
      redirect('/dashboard/projects');
      return;
    }
  } catch (err) {
    console.error('Error loading project:', err);
    error = 'Failed to load project';
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
        <h1 className="text-2xl font-semibold text-gray-900">Edit Project</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update project details and settings.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <ProjectForm project={project!} />
      </div>
    </div>
  );
}
