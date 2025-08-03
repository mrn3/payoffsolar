'use client';

import {useState, useEffect} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ContentType, ContentBlockWithType } from '@/lib/models';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import RichTextEditor from '@/components/ui/RichTextEditor';
import BlockEditor from '@/components/cms/BlockEditor';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CreateContentPage() {
  const router = useRouter();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    content_mode: 'rich_text' as 'rich_text' | 'blocks',
    type_id: '',
    published: false
  });
  const [contentBlocks, setContentBlocks] = useState<ContentBlockWithType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchContentTypes();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const fetchContentTypes = async () => {
    try {
      const response = await fetch('/api/content-types');
      if (response.ok) {
        const data = await response.json();
        setContentTypes(data.contentTypes);
      }
    } catch (error) {
      console.error('Error fetching content types:', error);
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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = generateSlug(e.target.value);
    setFormData(prev => ({ ...prev, slug }));
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Create the content first
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        const contentId = data.content.id;

        // If using blocks mode, save the content blocks
        if (formData.content_mode === 'blocks' && contentBlocks.length > 0) {
          for (const block of contentBlocks) {
            // Skip temporary blocks that don't have real IDs
            if (block.id.startsWith('temp-')) {
              console.log('Creating block:', {
                content_id: contentId,
                block_type_id: block.block_type_id,
                block_order: block.block_order,
                configuration: block.configuration
              });

              const blockResponse = await fetch('/api/content-blocks', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content_id: contentId,
                  block_type_id: block.block_type_id,
                  block_order: block.block_order,
                  configuration: block.configuration
                }),
              });

              if (!blockResponse.ok) {
                const blockError = await blockResponse.json();
                console.error('Error creating block:', blockError);
                throw new Error(`Failed to create block: ${blockError.error || 'Unknown error'}`);
              }
            }
          }
        }

        router.push(`/dashboard/cms/${contentId}`);
      } else {
        const errorData = await response.json();
        console.error('Content creation failed:', errorData);
        if (errorData._error === 'Slug already exists') {
          setErrors({ slug: 'This slug is already in use' });
        } else {
          toast.error(errorData._error || 'Failed to create content');
        }
      }
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create content');
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
                onChange={(e) => {
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
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="content_mode"
                      value="rich_text"
                      checked={formData.content_mode === 'rich_text'}
                      onChange={(e) => setFormData(prev => ({ ...prev, content_mode: e.target.value as 'rich_text' | 'blocks' }))}
                      className="mr-2"
                    />
                    Rich Text
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="content_mode"
                      value="blocks"
                      checked={formData.content_mode === 'blocks'}
                      onChange={(e) => setFormData(prev => ({ ...prev, content_mode: e.target.value as 'rich_text' | 'blocks' }))}
                      className="mr-2"
                    />
                    Content Blocks
                  </label>
                </div>
              </div>

              {formData.content_mode === 'rich_text' ? (
                <div className="mt-1">
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                    placeholder="Enter your content here with rich formatting..."
                  />
                </div>
              ) : (
                <div className="mt-1">
                  <BlockEditor
                    blocks={contentBlocks}
                    onBlocksChange={setContentBlocks}
                    className="border border-gray-300 rounded-md p-4"
                  />
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  id="published"
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
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
