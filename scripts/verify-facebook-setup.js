#!/usr/bin/env node

/**
 * Facebook Integration Verification Script
 * 
 * This script verifies that your Facebook Messenger integration is properly set up.
 * Run this after completing the migration and configuration.
 */

async function verifyFacebookSetup() {
  console.log('🔍 Verifying Facebook Messenger Integration Setup...\n');
  
  const baseUrl = 'https://payoffsolar.com';
  let allTestsPassed = true;

  // Test 1: Configuration Test
  console.log('1️⃣ Testing Facebook configuration...');
  try {
    const configResponse = await fetch(`${baseUrl}/api/facebook/test`);
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('   ✅ Configuration endpoint accessible');
      
      if (configData.config?.verify_token_configured) {
        console.log('   ✅ Verify token configured');
      } else {
        console.log('   ❌ Verify token not configured');
        allTestsPassed = false;
      }
      
      if (configData.config?.app_secret_configured) {
        console.log('   ✅ App secret configured');
      } else {
        console.log('   ❌ App secret not configured');
        allTestsPassed = false;
      }
      
      if (configData.config?.page_access_token_configured) {
        console.log('   ✅ Page access token configured');
      } else {
        console.log('   ❌ Page access token not configured');
        allTestsPassed = false;
      }

      if (configData.database?.tables_exist) {
        console.log('   ✅ Database tables exist');
      } else {
        console.log('   ❌ Database tables missing');
        allTestsPassed = false;
      }
    } else {
      console.log('   ❌ Configuration endpoint failed');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Configuration test failed:', error.message);
    allTestsPassed = false;
  }

  // Test 2: Webhook Verification
  console.log('\n2️⃣ Testing webhook verification...');
  try {
    const webhookUrl = `${baseUrl}/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=payoffsolar&hub.challenge=test123`;
    const webhookResponse = await fetch(webhookUrl);
    
    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.text();
      if (webhookData === 'test123') {
        console.log('   ✅ Webhook verification working');
      } else {
        console.log('   ❌ Webhook verification failed - wrong response:', webhookData);
        allTestsPassed = false;
      }
    } else {
      console.log('   ❌ Webhook verification failed - status:', webhookResponse.status);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Webhook test failed:', error.message);
    allTestsPassed = false;
  }

  // Test 3: Dashboard Accessibility
  console.log('\n3️⃣ Testing dashboard accessibility...');
  try {
    const dashboardResponse = await fetch(`${baseUrl}/dashboard/facebook-conversations`);
    if (dashboardResponse.ok) {
      console.log('   ✅ Facebook conversations dashboard accessible');
    } else if (dashboardResponse.status === 401 || dashboardResponse.status === 403) {
      console.log('   ✅ Dashboard protected (requires authentication)');
    } else {
      console.log('   ❌ Dashboard accessibility issue - status:', dashboardResponse.status);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ❌ Dashboard test failed:', error.message);
    allTestsPassed = false;
  }

  // Summary
  console.log('\n📊 Verification Summary:');
  if (allTestsPassed) {
    console.log('🎉 All tests passed! Your Facebook Messenger integration is ready.');
    console.log('\n📋 Next steps:');
    console.log('   1. Configure your Facebook App webhook URL: https://payoffsolar.com/api/facebook/webhook');
    console.log('   2. Subscribe your Facebook Page to the webhook');
    console.log('   3. Send a test message to your Facebook Page');
    console.log('   4. Check the dashboard for the conversation');
  } else {
    console.log('❌ Some tests failed. Please review the issues above and fix them.');
    console.log('\n🔧 Common fixes:');
    console.log('   - Run the database migration if tables are missing');
    console.log('   - Check environment variables are set correctly');
    console.log('   - Restart your application after making changes');
  }
}

verifyFacebookSetup();
