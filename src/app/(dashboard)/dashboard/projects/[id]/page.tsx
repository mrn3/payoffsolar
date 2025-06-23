import React from 'react';
import { requireAuth, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProjectModel, TaskModel } from '@/lib/models';
import ProjectDetailView from '@/components/projects/ProjectDetailView';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  // Require admin access
  const session = await requireAuth();
  if (!isAdmin(session.profile.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;

  let project = null;
  let tasks = [];
  let error = '';

  try {
    project = await ProjectModel.getById(id);
    if (!project) {
      redirect('/dashboard/projects');
      return;
    }

    tasks = await TaskModel.getByProjectId(id);
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
      <ProjectDetailView project={project!} tasks={tasks} />
    </div>
  );
}
