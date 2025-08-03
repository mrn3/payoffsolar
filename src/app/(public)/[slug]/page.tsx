import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { FaArrowLeft, FaCalendar, FaUser } from 'react-icons/fa';

interface ContentPageProps {
  params: Promise<{ slug: string }>;
}

interface ContentData {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  type_name?: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

async function getContent(slug: string): Promise<ContentData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/public/content/${slug}`, {
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
  }
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params;
  const content = await getContent(slug);

  if (!content) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBreadcrumbItems = () => {
    const items = [];
    
    // If it&apos;s a blog post, add blog to breadcrumb
    if (content.type_name === 'blog') {
      items.push({ label: 'Blog', href: '/blog' });
    }
    
    items.push({ label: content.title });
    return items;
  };

  const getBackLink = () => {
    if (content.type_name === 'blog') {
      return { href: '/blog', label: 'Back to Blog' };
    }
    return null; // No back link for CMS pages
  };

  const backLink = getBackLink();

  return (
    <div className="min-h-screen bg-gray-50">
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
          <div className="p-8">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {content.title}
              </h1>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <FaCalendar className="h-4 w-4 mr-2" />
                  <span>Published {formatDate(content.created_at)}</span>
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
            </header>

            {/* Content Body */}
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
  const content = await getContent(slug);

  if (!content) {
    return {
      title: 'Content Not Found',
    };
  }

  return {
    title: content.title,
    description: content.content 
      ? content.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...'
      : `Read ${content.title} on Payoff Solar`,
  };
}
