#!/usr/bin/env node

const http = require('http');
const https = require('https');

async function checkAppStatus() {
  console.log('=== Checking Next.js Application Status ===');
  
  // Test different possible URLs
  const testUrls = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ];
  
  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    
    try {
      const result = await testUrl(url);
      console.log(`Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log('✅ App is running!');
        console.log('Response preview:', result.data.substring(0, 200) + '...');
        
        // Test API endpoints
        await testApiEndpoints(url);
        return;
      } else {
        console.log(`❌ Unexpected status: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
    }
  }
  
  console.log('\n❌ No running Next.js app found on common ports');
  console.log('\nTroubleshooting steps:');
  console.log('1. Check if the app is running: pm2 list');
  console.log('2. Check app logs: pm2 logs payoffsolar');
  console.log('3. Start the app: yarn dev or yarn start');
  console.log('4. Check if port is in use: netstat -tlnp | grep :3000');
}

async function testUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testApiEndpoints(baseUrl) {
  console.log('\n=== Testing API Endpoints ===');
  
  const endpoints = [
    '/api/contacts',
    '/api/auth/profile'
  ];
  
  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    console.log(`\nTesting: ${endpoint}`);
    
    try {
      const result = await testUrl(url);
      console.log(`Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log('✅ Endpoint working');
        try {
          const json = JSON.parse(result.data);
          console.log('Response type:', typeof json);
          if (json.contacts) {
            console.log(`Found ${json.contacts.length} contacts`);
          }
        } catch (e) {
          console.log('Response is not JSON');
        }
      } else if (result.status === 401) {
        console.log('⚠️ Authentication required (expected for some endpoints)');
      } else if (result.status === 500) {
        console.log('❌ Internal server error');
        console.log('Error response:', result.data.substring(0, 500));
      } else {
        console.log(`❌ Unexpected status: ${result.status}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
}

checkAppStatus();
