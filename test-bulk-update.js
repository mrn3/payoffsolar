/**
 * Test script for bulk order status update functionality
 * Run with: node test-bulk-update.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:6600';

async function testBulkUpdate() {
  console.log('🧪 Testing bulk order status update...');
  
  try {
    // First, get all orders to find some order IDs
    console.log('📋 Fetching orders...');
    const ordersResponse = await fetch(`${BASE_URL}/api/orders`, {
      headers: {
        'Cookie': 'auth-token=your-admin-token-here' // You'll need to replace this with a real token
      }
    });
    
    if (!ordersResponse.ok) {
      console.log('❌ Failed to fetch orders. Make sure you have admin access.');
      console.log('Response status:', ordersResponse.status);
      return;
    }
    
    const ordersData = await ordersResponse.json();
    const orders = ordersData.orders || [];
    
    if (orders.length === 0) {
      console.log('❌ No orders found to test with');
      return;
    }
    
    console.log(`📦 Found ${orders.length} orders`);
    
    // Take the first 2 orders for testing
    const testOrderIds = orders.slice(0, 2).map(order => order.id);
    console.log('🎯 Testing with order IDs:', testOrderIds);
    
    // Test bulk update to 'processing' status
    console.log('🔄 Testing bulk status update to "processing"...');
    const bulkUpdateResponse = await fetch(`${BASE_URL}/api/orders/bulk-update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=your-admin-token-here' // You'll need to replace this with a real token
      },
      body: JSON.stringify({
        orderIds: testOrderIds,
        status: 'processing'
      })
    });
    
    if (bulkUpdateResponse.ok) {
      const result = await bulkUpdateResponse.json();
      console.log('✅ Bulk update successful:', result.message);
    } else {
      const error = await bulkUpdateResponse.json();
      console.log('❌ Bulk update failed:', error.error);
      console.log('Response status:', bulkUpdateResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test validation scenarios
async function testValidation() {
  console.log('\n🧪 Testing validation scenarios...');
  
  const testCases = [
    {
      name: 'Empty order IDs array',
      data: { orderIds: [], status: 'completed' },
      expectedStatus: 400
    },
    {
      name: 'Missing status',
      data: { orderIds: ['test-id'] },
      expectedStatus: 400
    },
    {
      name: 'Invalid status',
      data: { orderIds: ['test-id'], status: 'invalid-status' },
      expectedStatus: 400
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.name}`);
      const response = await fetch(`${BASE_URL}/api/orders/bulk-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=your-admin-token-here'
        },
        body: JSON.stringify(testCase.data)
      });
      
      if (response.status === testCase.expectedStatus) {
        console.log(`✅ ${testCase.name}: Correct validation (${response.status})`);
      } else {
        console.log(`❌ ${testCase.name}: Expected ${testCase.expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: Error - ${error.message}`);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting bulk update tests...\n');
  
  await testBulkUpdate();
  await testValidation();
  
  console.log('\n✨ Tests completed!');
  console.log('\n📝 Note: To run this test properly, you need to:');
  console.log('1. Make sure the dev server is running on port 6600');
  console.log('2. Replace "your-admin-token-here" with a real admin auth token');
  console.log('3. Have some orders in the database');
}

if (require.main === module) {
  runTests();
}
