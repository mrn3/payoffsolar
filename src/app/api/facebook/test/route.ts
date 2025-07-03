import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify Facebook environment variables are configured
export async function GET(request: NextRequest) {
  try {
    const config = {
      verify_token_configured: !!process.env.FACEBOOK_VERIFY_TOKEN,
      app_secret_configured: !!process.env.FACEBOOK_APP_SECRET,
      page_access_token_configured: !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
      verify_token_value: process.env.FACEBOOK_VERIFY_TOKEN ? 'SET' : 'NOT_SET',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    };

    return NextResponse.json({
      status: 'ok',
      message: 'Facebook configuration test',
      config
    });
  } catch (error) {
    console.error('Facebook test endpoint error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Test endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
