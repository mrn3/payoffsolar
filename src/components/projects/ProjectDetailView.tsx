'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaEdit, FaPlus, FaCalendar, FaDollarSign, FaUser, FaTasks, FaCheck, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { ProjectWithDetails, TaskWithDetails } from '@/lib/models';
import TaskList from '@/components/tasks/TaskList';
import toast from 'react-hot-toast';

interface ProjectDetailViewProps {
  project: ProjectWithDetails;
  tasks: TaskWithDetails[];
}

export default function ProjectDetailView({ project: initialProject, tasks: initialTasks }: ProjectDetailViewProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [tasks, setTasks] = useState(initialTasks);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const refreshTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?project_id=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
            </div>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Edit Project
            </button>
          </div>
        </div>

        {/* Project Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <FaTasks className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-500">Tasks</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{totalTasks}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <FaCheck className="h-5 w-5 text-green-400" />
              <span className="ml-2 text-sm font-medium text-gray-500">Completed</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{completedTasks}</p>
          </div>

          {project.owner_name && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <FaUser className="h-5 w-5 text-blue-400" />
                <span className="ml-2 text-sm font-medium text-gray-500">Owner</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-gray-900">{project.owner_name}</p>
            </div>
          )}

          {project.due_date && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <FaCalendar className="h-5 w-5 text-orange-400" />
                <span className="ml-2 text-sm font-medium text-gray-500">Due Date</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {format(new Date(project.due_date), 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Progress</span>
              <span className="text-gray-500">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {project.start_date && (
            <div>
              <span className="font-medium text-gray-700">Start Date:</span>
              <span className="ml-2 text-gray-600">
                {format(new Date(project.start_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          
          {project.budget && (
            <div>
              <span className="font-medium text-gray-700">Budget:</span>
              <span className="ml-2 text-gray-600">
                ${project.budget.toLocaleString()}
              </span>
            </div>
          )}

          <div>
            <span className="font-medium text-gray-700">Created:</span>
            <span className="ml-2 text-gray-600">
              {format(new Date(project.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
            <button
              onClick={() => router.push(`/dashboard/projects/${project.id}/tasks/new`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add Task
            </button>
          </div>
        </div>

        <div className="p-6">
          <TaskList 
            tasks={tasks} 
            projectId={project.id}
            onTaskUpdate={refreshTasks}
          />
        </div>
      </div>
    </div>
  );
}
