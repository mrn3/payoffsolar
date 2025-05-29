/**
 * Test script for email functionality
 * Run with: npx tsx src/lib/email/test.ts
 */

import { sendPasswordResetEmail } from './index';

async function testEmailService() {
  console.log('🧪 Testing email service...');
  
  const testEmail = 'test@example.com';
  const testToken = 'test-token-123';
  
  try {
    const result = await sendPasswordResetEmail(testEmail, testToken);
    
    if (result) {
      console.log('✅ Email service test passed');
    } else {
      console.log('❌ Email service test failed');
    }
  } catch (error) {
    console.error('❌ Email service test error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailService();
}
