import React from 'react';
import { ContentBlockWithType } from '@/lib/models';
import HeroBlock from './HeroBlock';
import CardGridBlock from './CardGridBlock';
import TextBlock from './TextBlock';
import ImageBlock from './ImageBlock';
import VideoBlock from './VideoBlock';

interface BlockRendererProps {
  blocks: ContentBlockWithType[];
  className?: string;
}

export default function BlockRenderer({ blocks, className = '' }: BlockRendererProps) {
  const renderBlock = (block: ContentBlockWithType) => {
    const { block_type_name, configuration } = block;

    switch (block_type_name) {
      case 'hero':
        return <HeroBlock key={block.id} config={configuration} />;
      
      case 'card_grid':
        return <CardGridBlock key={block.id} config={configuration} />;
      
      case 'text_block':
        return <TextBlock key={block.id} config={configuration} />;
      
      case 'image_block':
        return <ImageBlock key={block.id} config={configuration} />;
      
      case 'video_block':
        return <VideoBlock key={block.id} config={configuration} />;
      
      default:
        console.warn(`Unknown block type: ${block_type_name}`);
        return null;
    }
  };

  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className={`content-blocks-container ${className}`}>
      {blocks.map(renderBlock)}
    </div>
  );
}
