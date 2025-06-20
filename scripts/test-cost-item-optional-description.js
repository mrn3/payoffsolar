#!/usr/bin/env node

/**
 * Test script to verify that cost item descriptions are optional
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:6660';
const TEST_EMAIL = 'matt@payoffsolar.com';
const TEST_PASSWORD = 'admin123';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testCostItemOptionalDescription() {
  console.log('🧪 Testing Cost Item Optional Description');
  console.log('==========================================');
  
  try {
    const url = new URL(BASE_URL);
    
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    const loginOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/auth/signin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const loginResponse = await makeRequest(loginOptions, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.status, loginResponse.body);
      return;
    }

    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    console.log('✅ Login successful');

    // Step 2: Get first order to test with
    console.log('📋 Step 2: Getting orders...');
    const ordersOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/orders',
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
      }
    };

    const ordersResponse = await makeRequest(ordersOptions);
    if (ordersResponse.status !== 200 || !ordersResponse.body.orders || ordersResponse.body.orders.length === 0) {
      console.error('❌ Failed to get orders or no orders found:', ordersResponse.status, ordersResponse.body);
      return;
    }

    const testOrderId = ordersResponse.body.orders[0].id;
    console.log(`✅ Found test order: ${testOrderId}`);

    // Step 3: Get cost categories
    console.log('📂 Step 3: Getting cost categories...');
    const categoriesOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/cost-categories',
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
      }
    };

    const categoriesResponse = await makeRequest(categoriesOptions);
    if (categoriesResponse.status !== 200 || !categoriesResponse.body.categories || categoriesResponse.body.categories.length === 0) {
      console.error('❌ Failed to get cost categories:', categoriesResponse.status, categoriesResponse.body);
      return;
    }

    const testCategoryId = categoriesResponse.body.categories[0].id;
    console.log(`✅ Found test category: ${testCategoryId}`);

    // Step 4: Create cost item WITHOUT description
    console.log('💰 Step 4: Creating cost item without description...');
    const createCostItemOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/cost-items',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      }
    };

    const createResponse = await makeRequest(createCostItemOptions, {
      order_id: testOrderId,
      category_id: testCategoryId,
      amount: 100.50
      // Note: No description field
    });

    if (createResponse.status === 201) {
      console.log('✅ Cost item created successfully without description!');
      console.log('   Response:', createResponse.body);
    } else {
      console.error('❌ Failed to create cost item without description:', createResponse.status, createResponse.body);
      return;
    }

    // Step 5: Create cost item WITH empty description
    console.log('💰 Step 5: Creating cost item with empty description...');
    const createResponse2 = await makeRequest(createCostItemOptions, {
      order_id: testOrderId,
      category_id: testCategoryId,
      amount: 75.25,
      description: ""
    });

    if (createResponse2.status === 201) {
      console.log('✅ Cost item created successfully with empty description!');
      console.log('   Response:', createResponse2.body);
    } else {
      console.error('❌ Failed to create cost item with empty description:', createResponse2.status, createResponse2.body);
      return;
    }

    // Step 6: Create cost item WITH description
    console.log('💰 Step 6: Creating cost item with description...');
    const createResponse3 = await makeRequest(createCostItemOptions, {
      order_id: testOrderId,
      category_id: testCategoryId,
      amount: 200.00,
      description: "Test cost item with description"
    });

    if (createResponse3.status === 201) {
      console.log('✅ Cost item created successfully with description!');
      console.log('   Response:', createResponse3.body);
    } else {
      console.error('❌ Failed to create cost item with description:', createResponse3.status, createResponse3.body);
      return;
    }

    console.log('\n🎉 All tests passed! Cost item descriptions are now optional.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCostItemOptionalDescription();
