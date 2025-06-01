'use client';

import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';
import { ProductImage } from '@/lib/models';

interface ImageCarouselProps {
  images: string[] | ProductImage[];
  alt?: string;
  className?: string;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export default function ImageCarousel({
  images,
  alt = 'Product image',
  className = '',
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 5000
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Helper function to get image URL
  const getImageUrl = (image: string | ProductImage): string => {
    return typeof image === 'string' ? image : image.image_url;
  };

  // Helper function to get alt text
  const getAltText = (image: string | ProductImage, index: number): string => {
    if (typeof image === 'string') {
      return `${alt} ${index + 1}`;
    }
    return image.alt_text || `${alt} ${index + 1}`;
  };

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, images.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <FaImage className="h-12 w-12 text-gray-400" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={className}>
        <div className="relative w-full h-full">
          <img
            src={getImageUrl(images[0])}
            alt={getAltText(images[0], 0)}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.style.display = 'flex';
            }}
          />
          <div className="hidden w-full h-full items-center justify-center bg-gray-200 rounded-lg">
            <FaImage className="h-12 w-12 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Main Image */}
      <div className="relative w-full h-full group">
        <img
          src={getImageUrl(images[currentIndex])}
          alt={getAltText(images[currentIndex], currentIndex)}
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling!.style.display = 'flex';
          }}
        />
        <div className="hidden w-full h-full items-center justify-center bg-gray-200 rounded-lg">
          <FaImage className="h-12 w-12 text-gray-400" />
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
          aria-label="Previous image"
        >
          <FaChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
          aria-label="Next image"
        >
          <FaChevronRight className="h-4 w-4" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={typeof image === 'string' ? index : image.id}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentIndex
                  ? 'border-green-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={getImageUrl(image)}
                alt={getAltText(image, index)}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full items-center justify-center bg-gray-200">
                <FaImage className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
