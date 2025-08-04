'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { FaCalendar, FaUser, FaArrowRight } from 'react-icons/fa';

interface NewsPost {
  id: string;
  title: string;
  slug: string;
  content?: string;
  image_url?: string;
  type_name?: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

interface NewsResponse {
  content: NewsPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/content?type=news&page=${page}&limit=10`);

      if (!response.ok) {
        throw new Error('Failed to fetch news posts');
      }

      const data: NewsResponse = await response.json();
      setPosts(data.content);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching news posts:', err);
      setError('Failed to load news posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExcerpt = (content: string | undefined, maxLength: number = 200) => {
    if (!content) return '';
    const stripped = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return stripped.length > maxLength 
      ? stripped.substring(0, maxLength) + '...'
      : stripped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb items={[{ label: 'News' }]} className="mb-6" />
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading news posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb items={[{ label: 'News' }]} className="mb-6" />
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchPosts(currentPage)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'News' }]} className="mb-6" />

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Latest News</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest news, insights, and tips about solar energy and sustainable living.
          </p>
        </div>

        {/* News Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No news posts found.</p>
            <p className="text-gray-500 mt-2">Check back later for new content!</p>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Featured Image */}
                  {post.image_url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                      <Link
                        href={`/${post.slug}`}
                        className="hover:text-green-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    
                    {post.content && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {getExcerpt(post.content)}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <FaCalendar className="h-4 w-4 mr-2" />
                        {formatDate(post.created_at)}
                      </div>
                      {post.author_name && (
                        <div className="flex items-center">
                          <FaUser className="h-4 w-4 mr-2" />
                          {post.author_name}
                        </div>
                      )}
                    </div>
                    
                    <Link
                      href={`/${post.slug}`}
                      className="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                      Read More
                      <FaArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-md ${
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
