import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql/connection';
import { requireAuth, isAdmin } from '@/lib/auth';

// Debug endpoint to test Facebook database tables
// Restricted to admin users in non-production environments and disabled entirely in production
export async function GET(request: NextRequest) {
  try {
    // For security, do not expose this endpoint in production at all
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Require an authenticated admin session in non-production environments
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('🔍 Facebook debug endpoint called');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Check if tables exist
    try {
      const tables = await executeQuery(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('facebook_conversations', 'facebook_messages')
        ORDER BY TABLE_NAME
      `);
      
      results.tests.push({
        test: 'table_existence',
        status: 'success',
        result: {
          tables_found: tables.map((t: any) => t.TABLE_NAME),
          count: tables.length,
          expected: 2
        }
      });
    } catch (error) {
      results.tests.push({
        test: 'table_existence',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Check facebook_user_id column in contacts
    try {
      const columns = await executeQuery(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'contacts' 
        AND COLUMN_NAME = 'facebook_user_id'
      `);
      
      results.tests.push({
        test: 'facebook_user_id_column',
        status: 'success',
        result: {
          column_exists: columns.length > 0
        }
      });
    } catch (error) {
      results.tests.push({
        test: 'facebook_user_id_column',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Try to query facebook_conversations table
    try {
      const count = await executeQuery('SELECT COUNT(*) as count FROM facebook_conversations');
      results.tests.push({
        test: 'facebook_conversations_query',
        status: 'success',
        result: {
          conversation_count: count[0]?.count || 0
        }
      });
    } catch (error) {
      results.tests.push({
        test: 'facebook_conversations_query',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Try to query facebook_messages table
    try {
      const count = await executeQuery('SELECT COUNT(*) as count FROM facebook_messages');
      results.tests.push({
        test: 'facebook_messages_query',
        status: 'success',
        result: {
          message_count: count[0]?.count || 0
        }
      });
    } catch (error) {
      results.tests.push({
        test: 'facebook_messages_query',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Test the FacebookConversationModel
    try {
      const { FacebookConversationModel } = await import('@/lib/models');
      const conversations = await FacebookConversationModel.getAll(1, 0);
      results.tests.push({
        test: 'facebook_model_test',
        status: 'success',
        result: {
          model_works: true,
          conversation_count: conversations.length
        }
      });
    } catch (error) {
      results.tests.push({
        test: 'facebook_model_test',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Summary
    const successCount = results.tests.filter(t => t.status === 'success').length;
    const totalTests = results.tests.length;
    
    return NextResponse.json({
      status: successCount === totalTests ? 'all_passed' : 'some_failed',
      summary: `${successCount}/${totalTests} tests passed`,
      results
    });

  } catch (error) {
    console.error('Facebook debug endpoint error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Debug endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
