import React from 'react';
import Link from 'next/link';
import { CardGridBlockConfig } from '@/lib/models';
import { FaImage } from 'react-icons/fa';

interface CardGridBlockProps {
  config: CardGridBlockConfig;
  className?: string;
}

export default function CardGridBlock({ config, className = '' }: CardGridBlockProps) {
  const { title, subtitle, columns = 3, cards = [] } = config || {};

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: '#000000 !important', fontWeight: 'bold !important' }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-lg max-w-3xl mx-auto"
                style={{ color: '#1f2937 !important', fontWeight: '500 !important' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Cards Grid */}
        <div className={`grid ${gridClasses[columns as keyof typeof gridClasses]} gap-8`}>
          {Array.isArray(cards) && cards.length > 0 ? cards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Card Image */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                    <FaImage className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-6">
                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ color: '#000000 !important', fontWeight: 'bold !important' }}
                >
                  {card.title}
                </h3>
                {card.description && (
                  <p
                    className="mb-4 leading-relaxed"
                    style={{ color: '#1f2937 !important', fontWeight: '400 !important' }}
                  >
                    {card.description}
                  </p>
                )}
                {card.link && (
                  <Link
                    href={card.link}
                    className="inline-flex items-center font-medium transition-colors"
                    style={{ color: '#16a34a !important' }}
                  >
                    {card.linkText || 'Learn More'}
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p>No cards to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
