'use client';

import {useState, useEffect, useCallback} from 'react';
import {useParams, useRouter} from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ContentWithDetails, ContentType, ContentBlockWithType } from '@/lib/models';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import RichTextEditor from '@/components/ui/RichTextEditor';
import BlockEditor from '@/components/cms/BlockEditor';
import ImageUpload from '@/components/ui/ImageUpload';

export default function EditContentPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<ContentWithDetails | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    content_mode: 'rich_text' as 'rich_text' | 'blocks',
    image_url: '',
    type_id: '',
    published: false,
    published_date: ''
  });
  const [contentBlocks, setContentBlocks] = useState<ContentBlockWithType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchContent = useCallback(async (_id: string) => {
    try {
      const _response = await fetch(`/api/content/${_id}`);
      if (_response.ok) {
        const _data = await _response.json();
        setContent(_data.content);
        setFormData({
          title: _data.content.title,
          slug: _data.content.slug,
          content: _data.content.content || '',
          content_mode: _data.content.content_mode || 'rich_text',
          image_url: _data.content.image_url || '',
          type_id: _data.content.type_id,
          published: _data.content.published,
          published_date: _data.content.published_date ? _data.content.published_date.split('T')[0] : ''
        });

        // If content mode is blocks, fetch the content blocks
        if (_data.content.content_mode === 'blocks') {
          const blocksResponse = await fetch(`/api/content-blocks?contentId=${_id}`);
          if (blocksResponse.ok) {
            const blocksData = await blocksResponse.json();
            setContentBlocks(blocksData.blocks || []);
          }
        }
      } else if (_response.status === 404) {
        router.push('/dashboard/cms');
      }
    } catch (_error) {
      console.error('Error fetching content:', _error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchContentTypes = async () => {
    try {
      const _response = await fetch('/api/content-types');
      if (_response.ok) {
        const _data = await _response.json();
        setContentTypes(_data.contentTypes);
      }
    } catch (_error) {
      console.error('Error fetching content types:', _error);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchContent(params.id as string);
      fetchContentTypes();
    }
  }, [params.id, fetchContent]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    const title = _e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      // Only auto-generate slug if it matches the current auto-generated slug
      slug: content && generateSlug(content.title) === prev.slug ? generateSlug(title) : prev.slug
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

  const handleImageUpload = (images: any[]) => {
    if (images.length > 0) {
      setFormData(prev => ({ ...prev, image_url: images[0].url }));
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (_e: React.FormEvent) => {
    _e.preventDefault();

    if (!content) return;

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

    setSaving(true);
    try {
      const _response = await fetch(`/api/content/${content.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (_response.ok) {
        // If using blocks mode, update the content blocks
        if (formData.content_mode === 'blocks') {
          // Delete existing blocks first
          await fetch(`/api/content-blocks?contentId=${content.id}`, {
            method: 'DELETE',
          });

          // Create new blocks
          for (const block of contentBlocks) {
            await fetch('/api/content-blocks', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content_id: content.id,
                block_type_id: block.block_type_id,
                block_order: block.block_order,
                configuration: block.configuration
              }),
            });
          }
        }

        router.push(`/dashboard/cms/${content.id}`);
      } else {
        const errorData = await _response.json();
        if (errorData.error === 'Slug already exists') {
          setErrors({ slug: 'This slug is already in use' });
        } else {
          toast.error(errorData.error || 'Failed to update content');
        }
      }
    } catch (_error) {
      console.error('Error updating content:', _error);
      toast.error('Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="sm:col-span-2 h-10 bg-gray-200 rounded"></div>
              <div className="sm:col-span-2 h-32 bg-gray-200 rounded"></div>
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
          <p className="mt-2 text-gray-600">The content you&apos;re trying to edit doesn&apos;t exist.</p>
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
              href={`/dashboard/cms/${content.id}`}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Content</h1>
              <p className="mt-1 text-sm text-gray-600">
                Editing: {content.title}
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
                  setFormData(prev => ({ ...prev, type_id: _e.target.value }));
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
                This will be used in the URL.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Featured Image
              </label>
              <div className="mt-1">
                {formData.image_url ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={formData.image_url}
                        alt="Featured image"
                        className="w-48 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Click the × to remove the current image and upload a new one.
                    </p>
                  </div>
                ) : (
                  <ImageUpload
                    onImagesUploaded={handleImageUpload}
                    maxImages={1}
                    className="max-w-md"
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Upload a featured image for this content. This will be displayed on listing pages.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Content
              </label>

              <div className="mt-3 space-y-4">
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="content_mode"
                      value="rich_text"
                      checked={formData.content_mode === 'rich_text'}
                      onChange={(e) => setFormData(prev => ({ ...prev, content_mode: e.target.value as 'rich_text' | 'blocks' }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Rich Text</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="content_mode"
                      value="blocks"
                      checked={formData.content_mode === 'blocks'}
                      onChange={(e) => setFormData(prev => ({ ...prev, content_mode: e.target.value as 'rich_text' | 'blocks' }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Content Blocks</span>
                  </label>
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
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  id="published"
                  type="checkbox"
                  checked={formData.published}
                  onChange={(_e) => setFormData(prev => ({ ...prev, published: _e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
                  Published
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                If unchecked, content will be saved as a draft.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="published_date" className="block text-sm font-medium text-gray-700">
                Published Date
              </label>
              <input
                type="date"
                id="published_date"
                value={formData.published_date}
                onChange={(e) => setFormData(prev => ({ ...prev, published_date: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                The date this content was or will be published. Leave empty to use the creation date.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href={`/dashboard/cms/${content.id}`}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
