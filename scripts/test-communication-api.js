#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function testAPI() {
  try {
    // Get the site URL from environment or use default
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const isHttps = siteUrl.startsWith('https');
    const client = isHttps ? https : http;
    
    console.log(`Testing communication API at: ${siteUrl}`);
    
    // First, get a contact ID to test with
    console.log('\n1. Getting a contact to test with...');
    
    const contactsUrl = `${siteUrl}/api/contacts`;
    
    const contactsResponse = await new Promise((resolve, reject) => {
      const req = client.get(contactsUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data
            });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
    console.log(`Contacts API Status: ${contactsResponse.status}`);
    
    if (contactsResponse.status !== 200) {
      console.error('❌ Failed to get contacts:', contactsResponse.data);
      return;
    }
    
    const contacts = contactsResponse.data.contacts || [];
    if (contacts.length === 0) {
      console.log('❌ No contacts found to test with');
      return;
    }
    
    const testContact = contacts[0];
    console.log(`✅ Testing with contact: ${testContact.name} (${testContact.id})`);
    
    // Test the communication history API
    console.log('\n2. Testing communication history API...');
    
    const commUrl = `${siteUrl}/api/contacts/${testContact.id}/communications`;
    
    const commResponse = await new Promise((resolve, reject) => {
      const req = client.get(commUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              error: e.message
            });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
    console.log(`Communication API Status: ${commResponse.status}`);
    
    if (commResponse.status === 200) {
      console.log('✅ Communication API is working!');
      console.log(`Communications found: ${commResponse.data.communications?.length || 0}`);
      console.log(`Total count: ${commResponse.data.pagination?.total || 0}`);
      
      if (commResponse.data.communications && commResponse.data.communications.length > 0) {
        console.log('\nSample communication:');
        console.log(JSON.stringify(commResponse.data.communications[0], null, 2));
      }
    } else {
      console.error('❌ Communication API failed:');
      console.error('Status:', commResponse.status);
      console.error('Response:', commResponse.data);
      if (commResponse.error) {
        console.error('Parse Error:', commResponse.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();
