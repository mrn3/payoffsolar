#!/usr/bin/env node

/**
 * Facebook Webhook Testing Script
 * 
 * This script helps test and debug Facebook webhook functionality by:
 * 1. Testing webhook verification
 * 2. Sending test webhook payloads
 * 3. Checking webhook configuration
 * 4. Verifying environment variables
 * 
 * Usage: node scripts/test-facebook-webhook.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local or .env
function loadEnvFile() {
  // Try .env.local first (for local development)
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envPath = path.join(process.cwd(), '.env');

  let envFile = null;
  if (fs.existsSync(envLocalPath)) {
    envFile = envLocalPath;
    console.log('📁 Loading environment from .env.local');
  } else if (fs.existsSync(envPath)) {
    envFile = envPath;
    console.log('📁 Loading environment from .env');
  } else {
    console.log('⚠️ No .env.local or .env file found');
    return;
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

function generateSignature(body, secret) {
  return 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
}

async function testWebhookVerification(baseUrl) {
  console.log('\n🔍 Testing webhook verification...');
  
  const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    console.log('❌ FACEBOOK_VERIFY_TOKEN not found in environment');
    return false;
  }

  try {
    const url = `${baseUrl}/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test123`;
    console.log(`📡 Testing: ${url}`);
    
    const response = await fetch(url);
    
    if (response.ok) {
      const responseText = await response.text();
      if (responseText === 'test123') {
        console.log('✅ Webhook verification working correctly');
        return true;
      } else {
        console.log(`❌ Webhook verification failed - expected 'test123', got: ${responseText}`);
        return false;
      }
    } else {
      console.log(`❌ Webhook verification failed - status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Webhook verification test failed: ${error.message}`);
    return false;
  }
}

async function testWebhookMessage(baseUrl) {
  console.log('\n📨 Testing webhook message handling...');
  
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appSecret) {
    console.log('❌ FACEBOOK_APP_SECRET not found in environment');
    return false;
  }

  // Create a test message payload
  const testPayload = {
    object: 'page',
    entry: [
      {
        id: '123456789',
        time: Date.now(),
        messaging: [
          {
            sender: { id: 'test_user_123' },
            recipient: { id: '123456789' },
            timestamp: Date.now(),
            message: {
              mid: 'test_message_' + Date.now(),
              text: 'This is a test message from the webhook testing script'
            }
          }
        ]
      }
    ]
  };

  const body = JSON.stringify(testPayload);
  const signature = generateSignature(body, appSecret);

  try {
    console.log(`📡 Sending test payload to: ${baseUrl}/api/facebook/webhook`);
    console.log(`🔐 Using signature: ${signature}`);
    
    const response = await fetch(`${baseUrl}/api/facebook/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': signature
      },
      body: body
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ Webhook message test successful');
      console.log(`   Response: ${JSON.stringify(responseData)}`);
      return true;
    } else {
      console.log(`❌ Webhook message test failed - status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Webhook message test failed: ${error.message}`);
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔧 Checking environment variables...');
  
  const requiredVars = [
    'FACEBOOK_VERIFY_TOKEN',
    'FACEBOOK_APP_SECRET',
    'FACEBOOK_PAGE_ACCESS_TOKEN'
  ];

  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: SET (${value.length} characters)`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function testFacebookAPI() {
  console.log('\n🌐 Testing Facebook API access...');
  
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    console.log('❌ FACEBOOK_PAGE_ACCESS_TOKEN not found');
    return false;
  }

  try {
    console.log('📡 Testing Facebook API with page info request...');
    const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Facebook API working - Page: ${data.name} (ID: ${data.id})`);
      return true;
    } else {
      const error = await response.json();
      console.log(`❌ Facebook API failed - ${response.status}: ${JSON.stringify(error)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Facebook API test failed: ${error.message}`);
    return false;
  }
}

async function checkWebhookSubscription() {
  console.log('\n🔗 Checking webhook subscription...');
  
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    console.log('❌ FACEBOOK_PAGE_ACCESS_TOKEN not found');
    return false;
  }

  try {
    console.log('📡 Checking current webhook subscriptions...');
    const response = await fetch(`https://graph.facebook.com/v18.0/me/subscribed_apps?access_token=${accessToken}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Webhook subscriptions: ${JSON.stringify(data, null, 2)}`);
      
      if (data.data && data.data.length > 0) {
        console.log('✅ Page has webhook subscriptions');
        return true;
      } else {
        console.log('⚠️ No webhook subscriptions found - you may need to set up the webhook in Facebook Developer Console');
        return false;
      }
    } else {
      const error = await response.json();
      console.log(`❌ Failed to check subscriptions - ${response.status}: ${JSON.stringify(error)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Subscription check failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Facebook Webhook Testing Suite...');
  
  // Load environment variables
  loadEnvFile();
  
  // Determine base URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  console.log(`🌐 Using base URL: ${baseUrl}`);

  const results = {
    environmentVariables: false,
    facebookAPI: false,
    webhookVerification: false,
    webhookMessage: false,
    webhookSubscription: false
  };

  // Run all tests
  results.environmentVariables = await checkEnvironmentVariables();
  results.facebookAPI = await testFacebookAPI();
  results.webhookVerification = await testWebhookVerification(baseUrl);
  results.webhookMessage = await testWebhookMessage(baseUrl);
  results.webhookSubscription = await checkWebhookSubscription();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} - ${testName}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Your Facebook webhook should be working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the issues above.');
    console.log('\n💡 Common solutions:');
    console.log('   - Make sure your server is running and accessible');
    console.log('   - Verify all environment variables are set correctly');
    console.log('   - Check Facebook Developer Console webhook configuration');
    console.log('   - Ensure your webhook URL is publicly accessible (use ngrok for local testing)');
  }

  return allPassed;
}

// Run the tests
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
