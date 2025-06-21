#!/usr/bin/env node

/**
 * Comprehensive debug script for upload issues
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'matt@payoffsolar.com';
const TEST_PASSWORD = 'admin123';

console.log('🔍 Debugging Upload Issues');
console.log('==========================');
console.log(`Base URL: ${BASE_URL}`);

// Helper function for requests
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

async function debugUploadIssue() {
  try {
    const url = new URL(BASE_URL);
    
    console.log('🔐 Step 1: Testing authentication...');
    
    // Login
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

    const setCookieHeader = loginResponse.headers['set-cookie'];
    const authToken = setCookieHeader[0].split(';')[0];
    console.log('✅ Authentication working');

    console.log('\n📦 Step 2: Testing products API...');
    
    // Get products
    const productsOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/products?limit=5',
      method: 'GET',
      headers: {
        'Cookie': authToken
      }
    };

    const productsResponse = await makeRequest(productsOptions);
    
    if (productsResponse.status !== 200) {
      console.error('❌ Products API failed:', productsResponse.status);
      return;
    }

    console.log(`✅ Found ${productsResponse.body.products.length} products`);
    
    // Test the specific product from the URL
    const productIdFromUrl = '87b2c28-4bb0-11f0-bbcb-06479488ad4b';
    console.log(`\n🎯 Step 3: Testing specific product ID from URL: ${productIdFromUrl}`);
    
    const specificProductOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: `/api/products/${productIdFromUrl}`,
      method: 'GET',
      headers: {
        'Cookie': authToken
      }
    };

    const specificProductResponse = await makeRequest(specificProductOptions);
    
    if (specificProductResponse.status === 404) {
      console.log('❌ Product from URL does not exist in database');
      console.log('🔍 Available product IDs:');
      productsResponse.body.products.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.id} - ${p.name}`);
      });
      
      // Use the first available product for testing
      if (productsResponse.body.products.length > 0) {
        const testProduct = productsResponse.body.products[0];
        console.log(`\n🧪 Using first available product for testing: ${testProduct.name}`);
        
        // Test images API for this product
        console.log('\n🖼️  Step 4: Testing images API...');
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
          console.log(`✅ Images API working - found ${imagesResponse.body.images.length} images`);
          
          if (imagesResponse.body.images.length > 0) {
            console.log('📸 Existing images:');
            imagesResponse.body.images.forEach((img, i) => {
              console.log(`   ${i + 1}. ${img.image_url}`);
            });
          }
        } else {
          console.error('❌ Images API failed:', imagesResponse.status, imagesResponse.body);
        }
      }
    } else if (specificProductResponse.status === 200) {
      console.log('✅ Product from URL exists');
      
      // Test images API for the URL product
      console.log('\n🖼️  Step 4: Testing images API for URL product...');
      const imagesOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `/api/products/${productIdFromUrl}/images`,
        method: 'GET',
        headers: {
          'Cookie': authToken
        }
      };

      const imagesResponse = await makeRequest(imagesOptions);
      
      if (imagesResponse.status === 200) {
        console.log(`✅ Images API working - found ${imagesResponse.body.images.length} images`);
      } else {
        console.error('❌ Images API failed:', imagesResponse.status, imagesResponse.body);
      }
    }

    console.log('\n📁 Step 5: Checking upload directory...');
    
    // Check if upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    if (fs.existsSync(uploadDir)) {
      console.log('✅ Upload directory exists');
      const files = fs.readdirSync(uploadDir);
      console.log(`📂 Found ${files.length} files in upload directory`);
      
      if (files.length > 0) {
        console.log('📄 Files in upload directory:');
        files.slice(0, 5).forEach((file, i) => {
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   ${i + 1}. ${file} (${stats.size} bytes)`);
        });
        
        if (files.length > 5) {
          console.log(`   ... and ${files.length - 5} more files`);
        }
      }
    } else {
      console.log('❌ Upload directory does not exist');
      console.log('🔧 Creating upload directory...');
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ Upload directory created');
    }

    console.log('\n🌐 Step 6: Testing static file access...');
    
    // Test if we can access a static file
    const staticTestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/uploads/products/test.txt',
      method: 'GET'
    };

    const staticTestResponse = await makeRequest(staticTestOptions);
    console.log(`📄 Static file test status: ${staticTestResponse.status}`);
    
    if (staticTestResponse.status === 404) {
      console.log('ℹ️  404 is expected for non-existent file');
    }

    console.log('\n🎯 Summary and Recommendations:');
    console.log('================================');
    
    if (loginResponse.status === 200) {
      console.log('✅ Authentication is working');
    }
    
    if (productsResponse.status === 200) {
      console.log('✅ Products API is working');
    }
    
    console.log('\n🔧 Next steps:');
    console.log('1. Make sure you\'re testing with a valid product ID');
    console.log('2. Check that the upload directory has proper permissions');
    console.log('3. Verify that static files are served correctly by your web server');
    console.log('4. Test the upload functionality in the browser with a valid product');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugUploadIssue();
