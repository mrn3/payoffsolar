'use client';

import {useState, useEffect, useCallback} from 'react';
import {useParams, useRouter} from 'next/navigation';
import Link from 'next/link';
import {FaArrowLeft, FaEdit, FaGlobe, FaTrash} from 'react-icons/fa';
import { ContentWithDetails } from '@/lib/models';
import toast from 'react-hot-toast';

export default function ViewContentPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<ContentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (_params.id) {
      fetchContent(_params.id as string);
    }
  }, [params.id, fetchContent]);

  const fetchContent = useCallback(async (_id: string) => {
    try {
      const _response = await fetch(`/api/content/${id}`);
      if (_response.ok) {
        const _data = await response.json();
        setContent(_data.content);
      } else if (_response.status === 404) {
        router.push('/dashboard/cms');
      }
    } catch (_error) {
      console.error('Error fetching content:', _error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDelete = async () => {
    if (!content || !confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const _response = await fetch(`/api/content/${content.id}`, {
        method: 'DELETE',
      });

      if (_response.ok) {
        router.push('/dashboard/cms');
      } else {
        toast.error('Failed to delete content');
      }
    } catch (_error) {
      console.error('Error deleting content:', _error);
      toast.error('Failed to delete content');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Content not found</h2>
          <p className="mt-2 text-gray-600">The content you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/dashboard/cms"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Back to Content
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/dashboard/cms"
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{content.title}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {content.type_name?.charAt(0).toUpperCase() + content.type_name?.slice(1)} • 
                Created {formatDate(content.created_at)}
                {content.updated_at !== content.created_at && (
                  <> • Updated {formatDate(content.updated_at)}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {content.published && (
              <Link
                href={`/${content.slug}`}
                target="_blank"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FaGlobe className="mr-2 h-4 w-4" />
                View Live
              </Link>
            )}
            <Link
              href={`/dashboard/cms/${content.id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FaTrash className="mr-2 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <span className={`ml-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                  content.published 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {content.published ? 'Published' : 'Draft' }
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Author:</span>
                <span className="ml-2 text-sm text-gray-900">{content.author_name || 'Unknown'}</span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Slug:</span>
              <code className="ml-2 text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                /{content.slug}
              </code>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Content</h3>
          {content.content ? (
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {content.content}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No content available</p>
          )}
        </div>
      </div>
    </div>
  );
}
