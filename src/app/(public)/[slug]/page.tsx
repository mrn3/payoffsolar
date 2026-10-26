import React, { cache } from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { BlockRenderer } from '@/components/content-blocks';
import { FaArrowLeft, FaCalendar, FaUser } from 'react-icons/fa';
import { ContentModel, ContentBlockModel } from '@/lib/models';
import { pageMetadata, jsonLd, SITE_URL } from '@/lib/seo';
import { retiredContentRedirects, isPlaceholderHtml } from '@/lib/content-redirects';
import { createTextPreview } from '@/lib/utils/text';

interface ContentPageProps {
  params: Promise<{ slug: string }>;
}

const getContent = cache(async (slug: string) => {
  const retiredTarget = retiredContentRedirects[slug];
  if (retiredTarget) permanentRedirect(retiredTarget);

  const content = await ContentModel.getBySlug(slug);
  if (!content || !content.published) return null;
  const allBlocks = content.content_mode === 'blocks' ? await ContentBlockModel.getByContentId(content.id) : [];
  // Drop editor placeholder text that was never replaced
  const blocks = allBlocks.filter(block => !(block.block_type_name === 'text_block' && isPlaceholderHtml(block.configuration?.content)));
  return { content, blocks };
});

function youtubeId(url: string | undefined) {
  return url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)?.[1];
}

function blockText(blocks: Array<{ block_type_name?: string; configuration?: { content?: string } }>) {
  return blocks
    .filter(block => block.block_type_name === 'text_block')
    .map(block => block.configuration?.content || '')
    .join(' ');
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params;
  const result = await getContent(slug);

  if (!result) {
    notFound();
  }

  const { content, blocks } = result;

  const videoSchemas = blocks.flatMap(block => {
    if (block.block_type_name !== 'video_block') return [];
    const id = youtubeId(block.configuration?.url);
    if (!id) return [];
    return [{
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: block.configuration?.title || content.title,
      description: block.configuration?.description || content.title,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      uploadDate: new Date(content.published_date || content.created_at).toISOString(),
      url: `${SITE_URL}/${encodeURIComponent(content.slug)}`,
    }];
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBreadcrumbItems = () => {
    const items = [];

    // If it's a news post, add news to breadcrumb
    if (content.type_name === 'news') {
      items.push({ label: 'News', href: '/news' });
    }

    items.push({ label: content.title });
    return items;
  };

  const getBackLink = () => {
    if (content.type_name === 'news') {
      return { href: '/news', label: 'Back to News' };
    }
    return null; // No back link for CMS pages
  };

  const backLink = getBackLink();

  return (
    <div className="min-h-screen bg-gray-50">
      {videoSchemas.map(schema => (
        <script key={schema.embedUrl} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      ))}
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={getBreadcrumbItems()} className="mb-6" />

        {/* Back Button */}
        {backLink && (
          <div className="mb-6">
            <Link
              href={backLink.href}
              className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              {backLink.label}
            </Link>
          </div>
        )}

        {/* Content */}
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Featured Image Banner for blog posts */}
          {content.type_name === 'blog' && content.image_url && (
            <div className="w-full h-64 md:h-80 lg:h-96 overflow-hidden">
              <img
                src={content.image_url}
                alt={content.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {content.title}
              </h1>

              {/* Only show metadata for blog posts */}
              {content.type_name === 'blog' && (
                <>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <FaCalendar className="h-4 w-4 mr-2" />
                      <span>Published {formatDate(content.published_date || content.created_at)}</span>
                    </div>

                    {content.author_name && (
                      <div className="flex items-center">
                        <FaUser className="h-4 w-4 mr-2" />
                        <span>By {content.author_name}</span>
                      </div>
                    )}

                    {content.type_name && (
                      <div className="flex items-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                          {content.type_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {content.updated_at !== content.created_at && (
                    <div className="mt-2 text-sm text-gray-500">
                      Last updated {formatDate(content.updated_at)}
                    </div>
                  )}
                </>
              )}
            </header>

            {/* Content Body */}
            {content.content_mode === 'blocks' ? (
              // Render content blocks
              blocks && blocks.length > 0 ? (
                <BlockRenderer blocks={blocks} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No content blocks available.</p>
                </div>
              )
            ) : (
              // Render rich text content
              <div className="prose prose-lg max-w-none">
                {content.content ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: content.content }}
                    className="text-gray-700 leading-relaxed"
                  />
                ) : (
                  <p className="text-gray-500 italic">No content available.</p>
                )}
              </div>
            )}
          </div>
        </article>

        {/* Navigation */}
        {backLink && (
          <div className="mt-8 flex justify-center">
            <Link
              href={backLink.href}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors inline-flex items-center"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              {backLink.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ContentPageProps) {
  const { slug } = await params;
  const result = await getContent(slug);

  if (!result) {
    notFound();
  }

  const { content, blocks } = result;

  const bodyHtml = content.content_mode === 'blocks' ? blockText(blocks) : content.content;
  return pageMetadata(
    `${content.title} | Payoff Solar`,
    bodyHtml ? createTextPreview(bodyHtml, 157) : `Read ${content.title} on Payoff Solar`,
    `/${encodeURIComponent(content.slug)}`,
  );
}
