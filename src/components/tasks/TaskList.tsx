'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrash, FaUser, FaCalendar, FaClock, FaFlag } from 'react-icons/fa';
import { format } from 'date-fns';
import { TaskWithDetails } from '@/lib/models';
import toast from 'react-hot-toast';

interface TaskListProps {
  tasks: TaskWithDetails[];
  projectId?: string;
  onTaskUpdate?: () => void;
}

export default function TaskList({ tasks, projectId, onTaskUpdate }: TaskListProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Task status updated');
        if (onTaskUpdate) {
          onTaskUpdate();
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Task deleted successfully');
        if (onTaskUpdate) {
          onTaskUpdate();
        }
        setShowDeleteModal(false);
        setSelectedTask(null);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No tasks found.</p>
        {projectId && (
          <button
            onClick={() => router.push(`/dashboard/projects/${projectId}/tasks/new`)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Create First Task
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {task.title}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <FaFlag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} title={`${task.priority} priority`} />
                </div>
                
                {task.description && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                  {task.assigned_to_name && (
                    <div className="flex items-center">
                      <FaUser className="mr-1 h-4 w-4" />
                      <span>{task.assigned_to_name}</span>
                    </div>
                  )}
                  
                  {task.due_date && (
                    <div className="flex items-center">
                      <FaCalendar className="mr-1 h-4 w-4" />
                      <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}

                  {task.estimated_hours && (
                    <div className="flex items-center">
                      <FaClock className="mr-1 h-4 w-4" />
                      <span>{task.estimated_hours}h estimated</span>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <label htmlFor={`status-${task.id}`} className="sr-only">
                    Change status
                  </label>
                  <select
                    id={`status-${task.id}`}
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}
                  className="text-blue-600 hover:text-blue-900 p-2"
                  title="Edit task"
                >
                  <FaEdit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setShowDeleteModal(true);
                  }}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Delete task"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{selectedTask.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 px-4 py-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
