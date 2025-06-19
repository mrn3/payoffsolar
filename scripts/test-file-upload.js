#!/usr/bin/env node

/**
 * Test script to verify actual file upload functionality
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:6660';
const TEST_EMAIL = 'matt@payoffsolar.com';
const TEST_PASSWORD = 'admin123';

console.log('🧪 Testing File Upload Functionality');
console.log('====================================');
console.log(`Base URL: ${BASE_URL}`);

// Create a simple test image (1x1 PNG)
const createTestImage = () => {
  const testImagePath = '/tmp/test-upload.png';
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8E, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
};

// Helper function to make HTTP requests with form data
function uploadFile(options, filePath, authToken) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    // Read the file
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // Create multipart form data
    const boundary = '----formdata-boundary-' + Math.random().toString(36);
    const formData = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="files"; filename="${fileName}"`,
      'Content-Type: image/png',
      '',
      fileData.toString('binary'),
      `--${boundary}--`,
      ''
    ].join('\r\n');
    
    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData, 'binary'),
        'Cookie': authToken
      }
    };
    
    const req = protocol.request(requestOptions, (res) => {
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
    req.write(formData, 'binary');
    req.end();
  });
}

// Helper function for JSON requests
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

async function testFileUpload() {
  let testImagePath = null;
  
  try {
    const url = new URL(BASE_URL);
    
    // Create test image
    console.log('🖼️  Creating test image...');
    testImagePath = createTestImage();
    console.log(`✅ Test image created: ${testImagePath}`);
    
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

    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (!setCookieHeader) {
      console.error('❌ No auth cookie received');
      return;
    }

    const authToken = setCookieHeader[0].split(';')[0];
    console.log('✅ Login successful');

    // Step 2: Upload file
    console.log('📤 Step 2: Uploading test image...');
    const uploadOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/upload',
      method: 'POST'
    };

    const uploadResponse = await uploadFile(uploadOptions, testImagePath, authToken);
    
    if (uploadResponse.status === 200) {
      console.log('✅ File upload successful!');
      console.log('📁 Uploaded files:', uploadResponse.body.files);
      
      // Step 3: Test adding image to a product
      console.log('🔗 Step 3: Testing add image to product...');
      
      // First get a product
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
      
      if (productsResponse.status === 200 && productsResponse.body.products.length > 0) {
        const testProduct = productsResponse.body.products[0];
        const uploadedFile = uploadResponse.body.files[0];
        
        // Add image to product
        const addImageOptions = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: `/api/products/${testProduct.id}/images`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': authToken
          }
        };

        const addImageResponse = await makeRequest(addImageOptions, {
          image_url: uploadedFile.url,
          alt_text: 'Test uploaded image'
        });

        if (addImageResponse.status === 201) {
          console.log('✅ Image successfully added to product!');
          console.log(`🔗 Image added to product: ${testProduct.name}`);
        } else {
          console.error('❌ Failed to add image to product:', addImageResponse.status, addImageResponse.body);
        }
      }
      
    } else {
      console.error('❌ File upload failed:', uploadResponse.status, uploadResponse.body);
    }

    console.log('\n🎯 File Upload Test Summary:');
    console.log(`- Login: ${loginResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`- File Upload: ${uploadResponse.status === 200 ? '✅' : '❌'}`);
    
    if (uploadResponse.status === 200) {
      console.log('\n🎉 File upload functionality is working correctly!');
    } else {
      console.log('\n❌ File upload needs debugging. Check server logs with: pm2 logs payoffsolar');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up test file
    if (testImagePath && fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🧹 Test image cleaned up');
    }
  }
}

// Run the test
testFileUpload();
