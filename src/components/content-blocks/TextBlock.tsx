import React from 'react';
import { TextBlockConfig } from '@/lib/models';

interface TextBlockProps {
  config: TextBlockConfig;
  className?: string;
}

export default function TextBlock({ config, className = '' }: TextBlockProps) {
  const { content, textAlign = 'left' } = config;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div className={`py-8 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <div
          className={`prose prose-lg max-w-none ${alignmentClasses[textAlign]}`}
          style={{ color: '#374151' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
