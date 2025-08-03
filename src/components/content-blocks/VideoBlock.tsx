import React from 'react';
import { VideoBlockConfig } from '@/lib/models';

interface VideoBlockProps {
  config: VideoBlockConfig;
  className?: string;
}

export default function VideoBlock({ config, className = '' }: VideoBlockProps) {
  const { url, title, description, autoplay = false } = config;

  // Extract video ID and platform from URL
  const getVideoEmbedUrl = (videoUrl: string) => {
    // YouTube
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}${autoplay ? '?autoplay=1' : ''}`;
    }

    // Vimeo
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}${autoplay ? '?autoplay=1' : ''}`;
    }

    // Return original URL if no match (assume it's already an embed URL)
    return videoUrl;
  };

  const embedUrl = getVideoEmbedUrl(url);

  return (
    <div className={`py-8 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {(title || description) && (
          <div className="text-center mb-6">
            {title && (
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-gray-600">
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className="relative aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
          <iframe
            src={embedUrl}
            title={title || 'Video'}
            className="w-full h-full"
            style={{ aspectRatio: '16/9' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
