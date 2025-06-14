'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ContentType } from '@/lib/models';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

export default function CreateContentPage() {
  const router = useRouter();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    type_id: '',
    published: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchContentTypes();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchContentTypes = async () => {
    try {
      const _response = await fetch('/api/content-types');
      if (_response.ok) {
        const _data = await response.json();
        setContentTypes(_data.contentTypes);
      }
    } catch (_error) {
      console.error('Error fetching content types:', _error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handleSlugChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = generateSlug(_e.target.value);
    setFormData(prev => ({ ...prev, slug }));
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  const handleSubmit = async (_e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }
    if (!formData.type_id) {
      newErrors.type_id = 'Content type is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const _response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (_response.ok) {
        const _data = await response.json();
        router.push(`/dashboard/cms/${data.content.id}`);
      } else {
        const errorData = await response.json();
        if (errorData._error === 'Slug already exists') {
          setErrors({ slug: 'This slug is already in use' });
        } else {
          toast.error(errorData.error || 'Failed to create content');
        }
      }
    } catch (_error) {
      console.error('Error creating content:', _error);
      toast.error('Failed to create content');
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-2xl font-semibold text-gray-900">Create Content</h1>
              <p className="mt-1 text-sm text-gray-600">
                Add new content to your website
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={handleTitleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                  errors.title ? 'border-red-300' : ''
                }`}
                placeholder="Enter content title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="type_id" className="block text-sm font-medium text-gray-700">
                Content Type *
              </label>
              <select
                id="type_id"
                value={formData.type_id}
                onChange={(_e) => {
                  setFormData(prev => ({ ...prev, type_id: e.target.value }));
                  if (errors.type_id) {
                    setErrors(prev => ({ ...prev, type_id: '' }));
                  }
                }}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                  errors.type_id ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select content type</option>
                {contentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                  </option>
                ))}
              </select>
              {errors.type_id && (
                <p className="mt-1 text-sm text-red-600">{errors.type_id}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                Slug *
              </label>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={handleSlugChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                  errors.slug ? 'border-red-300' : ''
                }`}
                placeholder="url-friendly-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                This will be used in the URL. Auto-generated from title.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="content"
                rows={12}
                value={formData.content}
                onChange={(_e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="Enter your content here..."
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  id="published"
                  type="checkbox"
                  checked={formData.published}
                  onChange={(_e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
                  Publish immediately
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                If unchecked, content will be saved as a draft.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/dashboard/cms"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Content' }
          </button>
        </div>
      </form>
    </div>
  );
}
