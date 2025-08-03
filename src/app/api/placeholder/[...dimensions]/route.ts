import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ dimensions: string[] }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { dimensions } = await params;
    const [width, height] = dimensions;
    
    // Create a simple SVG placeholder
    const w = parseInt(width) || 400;
    const h = parseInt(height) || 300;
    
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle" dy=".3em">
          ${w} × ${h}
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
