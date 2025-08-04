#!/usr/bin/env node

/**
 * Script to test the news API endpoint directly
 * This simulates the exact call that the news page makes
 */

const http = require('http');
const https = require('https');

async function testNewsAPI() {
  console.log('=== Testing News API Endpoint ===');
  
  // Test both local and production URLs
  const urls = [
    'http://localhost:3000/api/public/content?type=news&page=1&limit=10',
    'http://localhost:6666/api/public/content?type=news&page=1&limit=10'
  ];
  
  for (const url of urls) {
    console.log(`\nTesting: ${url}`);
    
    try {
      const response = await makeRequest(url);
      console.log(`✅ Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        console.log(`✅ Content items: ${data.content?.length || 0}`);
        console.log(`✅ Total: ${data.pagination?.total || 0}`);
        
        if (data.content && data.content.length > 0) {
          console.log('✅ Sample content:');
          data.content.slice(0, 2).forEach(item => {
            console.log(`  - ${item.title} (Published: ${item.published})`);
          });
        }
      } else {
        console.log(`❌ Error response: ${response.body}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'News API Test Script'
      }
    };
    
    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

testNewsAPI().catch(console.error);
