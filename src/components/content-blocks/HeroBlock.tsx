import React from 'react';
import { HeroBlockConfig } from '@/lib/models';

interface HeroBlockProps {
  config: HeroBlockConfig;
  className?: string;
}

export default function HeroBlock({ config, className = '' }: HeroBlockProps) {
  const { title, subtitle, backgroundImage, textAlign = 'center' } = config;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <div
      className={`relative py-16 px-4 sm:px-6 lg:px-8 ${className}`}
      style={backgroundImage ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      <div className="max-w-4xl mx-auto">
        <div className={`${alignmentClasses[textAlign]}`}>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{
              color: backgroundImage ? '#ffffff !important' : '#000000 !important',
              fontWeight: 'bold !important'
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-xl md:text-2xl max-w-3xl mx-auto"
              style={{
                color: backgroundImage ? '#f3f4f6 !important' : '#1f2937 !important',
                fontWeight: '500 !important'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
