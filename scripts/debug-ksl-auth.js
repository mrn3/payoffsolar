#!/usr/bin/env node

/**
 * Debug script for KSL authentication
 * This script helps troubleshoot KSL login issues with detailed logging and screenshots
 */

// Note: This script requires running in a Node.js environment with TypeScript support
// For now, we'll use a simplified approach that works with the compiled version

async function debugKslAuth() {
  console.log('🔍 KSL Authentication Debug Tool\n');

  // Mock platform object
  const mockPlatform = {
    id: 'ksl-debug',
    name: 'ksl',
    display_name: 'KSL Classifieds',
    requires_auth: true,
    is_active: true,
    api_endpoint: 'https://classifieds.ksl.com',
    configuration: {
      max_title_length: 100,
      max_description_length: 4000,
      max_images: 8
    }
  };

  // Get credentials from command line arguments or prompt
  const args = process.argv.slice(2);
  let username, password;

  if (args.length >= 2) {
    username = args[0];
    password = args[1];
  } else {
    console.log('Usage: node scripts/debug-ksl-auth.js <username> <password>');
    console.log('Example: node scripts/debug-ksl-auth.js your-email@example.com your-password');
    return;
  }

  console.log('⚠️  Note: This debug script requires the development server to be running.');
  console.log('   Please use the admin dashboard to test authentication instead.');
  console.log('   Go to: http://localhost:3000/dashboard/settings/platforms');
  console.log('   The improved authentication will now:');
  console.log('   - Fill the email field character by character');
  console.log('   - Verify the field values after filling');
  console.log('   - Take debug screenshots');
  console.log('   - Provide detailed logging');

  return;

  console.log('📋 Checking credentials...');
  const hasCredentials = kslService.hasRequiredCredentials();
  console.log(`✅ Has required credentials: ${hasCredentials}`);

  if (!hasCredentials) {
    console.log('❌ Invalid credentials provided');
    return;
  }

  console.log('\n🔐 Starting authentication test...');
  console.log('📸 Debug screenshots will be saved to temp/ directory');
  console.log('🔍 Detailed logs will show the authentication process\n');

  try {
    const authResult = await kslService.authenticate();
    
    console.log('\n📊 Authentication Results:');
    console.log(`✅ Success: ${authResult}`);
    
    if (authResult) {
      console.log('🎉 Authentication successful!');
      console.log('   Your KSL credentials are working correctly.');
    } else {
      console.log('❌ Authentication failed.');
      console.log('   Please check the debug screenshots and logs above.');
      console.log('   Common issues:');
      console.log('   - Incorrect username or password');
      console.log('   - Account locked or suspended');
      console.log('   - CAPTCHA required (not supported in automation)');
      console.log('   - KSL website changes');
    }

  } catch (error) {
    console.error('\n💥 Authentication error:', error.message);
    console.error('   Stack trace:', error.stack);
  }

  console.log('\n🧹 Cleaning up browser...');
  // Cleanup will happen automatically when the process exits
  
  console.log('✅ Debug test completed!');
  console.log('📁 Check the temp/ directory for debug screenshots');
}

// Run the debug test
if (require.main === module) {
  debugKslAuth().catch(error => {
    console.error('❌ Debug test failed:', error);
    process.exit(1);
  });
}

module.exports = { debugKslAuth };
