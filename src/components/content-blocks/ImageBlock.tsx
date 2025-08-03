import React from 'react';
import { ImageBlockConfig } from '@/lib/models';
import { FaImage } from 'react-icons/fa';

interface ImageBlockProps {
  config: ImageBlockConfig;
  className?: string;
}

export default function ImageBlock({ config, className = '' }: ImageBlockProps) {
  const { image, caption, alt, size = 'medium' } = config;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'max-w-full'
  };

  return (
    <div className={`py-8 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className={`mx-auto ${sizeClasses[size]}`}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={alt || caption || 'Image'}
              className="w-full h-auto object-cover"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-100">
              <FaImage className="h-16 w-16 text-gray-400" />
            </div>
          )}
          {caption && (
            <div className="p-4">
              <p className="text-sm text-gray-600 text-center italic">
                {caption}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
