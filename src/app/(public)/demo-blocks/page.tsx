import React from 'react';
import { BlockRenderer } from '@/components/content-blocks';
import { ContentBlockWithType } from '@/lib/models';

export default function DemoBlocksPage() {
  // Demo content blocks that match your How-To Guides example
  const demoBlocks: ContentBlockWithType[] = [
    {
      id: 'demo-hero',
      content_id: 'demo-content',
      block_type_id: 'hero-type',
      block_type_name: 'hero',
      block_type_display_name: 'Hero Section',
      block_order: 0,
      configuration: {
        title: 'How-To Guides',
        subtitle: 'These are how-to guides to help you purchase, install, and use solar panels.',
        textAlign: 'center'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-card-grid',
      content_id: 'demo-content',
      block_type_id: 'card-grid-type',
      block_type_name: 'card_grid',
      block_type_display_name: 'Card Grid',
      block_order: 1,
      configuration: {
        columns: 3,
        cards: [
          {
            title: 'How To Install Solar Panels Yourself',
            description: 'Matt describes how he installed a 7KW solar panel system on his roof for $4,000 after tax credits, significantly reducing costs by doing it himself and avoiding professional installation fees.',
            image: '/api/placeholder/400/300',
            link: '/how-to/install-solar-panels',
            linkText: 'Read Guide'
          },
          {
            title: 'How To Install Unistrut Racking System Yourself',
            description: 'Matt describes how he replaced his original treated lumber racking system with a Unistrut one, which are both much less expensive alternatives to a pre-built system.',
            image: '/api/placeholder/400/300',
            link: '/how-to/unistrut-racking',
            linkText: 'Read Guide'
          },
          {
            title: 'How To Make Decisions On Your Solar Project',
            description: 'This is an explanation of all the decisions you will need to make and helps guide you on those decisions.',
            image: '/api/placeholder/400/300',
            link: '/how-to/solar-decisions',
            linkText: 'Read Guide'
          },
          {
            title: 'How To Build A Ground Mount Solar Array',
            description: 'Step-by-step guide for building a ground-mounted solar panel system, including foundation, racking, and electrical connections.',
            image: '/api/placeholder/400/300',
            link: '/how-to/ground-mount',
            linkText: 'Read Guide'
          },
          {
            title: 'How To Get Help On Your Solar Project',
            description: 'Resources and support options available for your solar installation project, including consultation services and troubleshooting.',
            image: '/api/placeholder/400/300',
            link: '/how-to/get-help',
            linkText: 'Read Guide'
          }
        ]
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-4"
            style={{ color: '#000000 !important', fontWeight: 'bold !important' }}
          >
            Content Blocks Demo
          </h1>
          <p
            className="text-lg"
            style={{ color: '#1f2937 !important', fontWeight: '400 !important' }}
          >
            This page demonstrates the content blocks system that allows you to easily create
            structured content like the How-To Guides section. The blocks below are rendered
            using the same components that would be used in the CMS.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <BlockRenderer blocks={demoBlocks} />
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2
            className="text-xl font-semibold mb-3"
            style={{ color: '#1e3a8a !important', fontWeight: 'bold !important' }}
          >
            How to Use Content Blocks
          </h2>
          <div className="space-y-2">
            <p style={{ color: '#1e40af !important', fontWeight: '500 !important' }}>
              <strong>1.</strong> Go to the CMS and create new content
            </p>
            <p style={{ color: '#1e40af !important', fontWeight: '500 !important' }}>
              <strong>2.</strong> Choose "Content Blocks" mode instead of "Rich Text"
            </p>
            <p style={{ color: '#1e40af !important', fontWeight: '500 !important' }}>
              <strong>3.</strong> Add blocks like Hero sections, Card grids, Text blocks, Images, and Videos
            </p>
            <p style={{ color: '#1e40af !important', fontWeight: '500 !important' }}>
              <strong>4.</strong> Configure each block with your content
            </p>
            <p style={{ color: '#1e40af !important', fontWeight: '500 !important' }}>
              <strong>5.</strong> Drag and drop to reorder blocks
            </p>
            <p style={{ color: '#1e40af !important', fontWeight: '500 !important' }}>
              <strong>6.</strong> Publish your content and it will render like this demo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
