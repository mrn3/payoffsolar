import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql/connection';

// Simple test endpoint to verify Facebook environment variables and database tables
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

    // Check if Facebook tables exist
    let tablesExist = false;
    let tableError = null;
    let conversationCount = 0;

    try {
      // Check if facebook_conversations table exists
      const tables = await executeQuery(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('facebook_conversations', 'facebook_messages')
      `);

      tablesExist = tables.length === 2;

      if (tablesExist) {
        // Test a simple query
        try {
          const countResult = await executeQuery('SELECT COUNT(*) as count FROM facebook_conversations');
          conversationCount = countResult[0]?.count || 0;
        } catch (countError) {
          tableError = `Table exists but query failed: ${countError instanceof Error ? countError.message : 'Unknown error'}`;
        }
      }
    } catch (error) {
      tableError = error instanceof Error ? error.message : 'Unknown database error';
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Facebook configuration test',
      config: {
        ...config,
        conversation_count: conversationCount
      },
      database: {
        tables_exist: tablesExist,
        conversation_count: conversationCount,
        error: tableError
      }
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
