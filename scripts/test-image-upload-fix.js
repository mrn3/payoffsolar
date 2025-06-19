#!/usr/bin/env node

/**
 * Test script to verify image upload API fix is working
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:6660';
const TEST_EMAIL = 'matt@payoffsolar.com';
const TEST_PASSWORD = 'admin123';

console.log('🧪 Testing Image Upload API Fix');
console.log('================================');
console.log(`Base URL: ${BASE_URL}`);

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
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

async function testImageUploadFix() {
  try {
    const url = new URL(BASE_URL);
    
    // Step 1: Test login to get auth token
    console.log('🔐 Step 1: Testing login...');
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

    console.log('✅ Login successful');
    
    // Extract auth token from Set-Cookie header
    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (!setCookieHeader) {
      console.error('❌ No auth cookie received');
      return;
    }

    const authToken = setCookieHeader[0].split(';')[0]; // Get the auth-token=value part
    console.log('🍪 Auth token received');

    // Step 2: Test products API
    console.log('📦 Step 2: Testing products API...');
    const productsOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/products?limit=1',
      method: 'GET',
      headers: {
        'Cookie': authToken
      }
    };

    const productsResponse = await makeRequest(productsOptions);
    
    if (productsResponse.status !== 200) {
      console.error('❌ Products API failed:', productsResponse.status, productsResponse.body);
      return;
    }

    console.log('✅ Products API working');
    
    if (!productsResponse.body.products || productsResponse.body.products.length === 0) {
      console.error('❌ No products found in database');
      return;
    }

    const testProduct = productsResponse.body.products[0];
    console.log(`📦 Using test product: ${testProduct.name} (ID: ${testProduct.id})`);

    // Step 3: Test product images API
    console.log('🖼️  Step 3: Testing product images API...');
    const imagesOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: `/api/products/${testProduct.id}/images`,
      method: 'GET',
      headers: {
        'Cookie': authToken
      }
    };

    const imagesResponse = await makeRequest(imagesOptions);
    
    if (imagesResponse.status === 200) {
      console.log('✅ Product images API working');
      console.log(`📊 Found ${imagesResponse.body.images.length} images for this product`);
    } else if (imagesResponse.status === 404) {
      console.error('❌ Product images API returned 404 - This is the bug!');
      console.error('Response:', imagesResponse.body);
    } else {
      console.error('❌ Product images API failed:', imagesResponse.status, imagesResponse.body);
    }

    // Step 4: Test upload API
    console.log('📤 Step 4: Testing upload API...');
    const uploadOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Cookie': authToken,
        'Content-Type': 'application/json'
      }
    };

    // Note: This is a simplified test - actual file upload would need multipart/form-data
    const uploadResponse = await makeRequest(uploadOptions, {});
    
    if (uploadResponse.status === 400) {
      console.log('✅ Upload API responding (400 expected for empty request)');
    } else {
      console.log(`📤 Upload API status: ${uploadResponse.status}`);
    }

    console.log('\n🎯 Summary:');
    console.log(`- Login: ${loginResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`- Products API: ${productsResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`- Images API: ${imagesResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`- Upload API: ${uploadResponse.status === 400 ? '✅' : '❌'}`);

    if (imagesResponse.status === 404) {
      console.log('\n🔧 The image upload fix needs to be deployed to the server.');
      console.log('Run the deployment steps in TROUBLESHOOT_SERVER_DEPLOYMENT.md');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testImageUploadFix();
