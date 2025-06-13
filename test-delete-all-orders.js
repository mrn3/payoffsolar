/**
 * Test script for delete all orders functionality
 * Tests the modal-based delete all orders feature
 * Run with: node test-delete-all-orders.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:6600';

async function testDeleteAllOrders() {
  console.log('🧪 Testing delete all orders functionality...');
  
  try {
    // First, get the current count of orders
    console.log('📋 Fetching current orders count...');
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
    const initialOrderCount = ordersData.orders ? ordersData.orders.length : 0;
    
    console.log(`📦 Found ${initialOrderCount} orders before deletion`);
    
    if (initialOrderCount === 0) {
      console.log('ℹ️  No orders to delete. Creating a test order first...');
      
      // Create a test order for deletion
      const testOrderResponse = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=your-admin-token-here'
        },
        body: JSON.stringify({
          contact_id: 'test-contact-id',
          status: 'pending',
          order_date: new Date().toISOString().split('T')[0],
          items: [
            {
              product_id: 'test-product-id',
              quantity: 1,
              price: 100.00
            }
          ]
        })
      });
      
      if (!testOrderResponse.ok) {
        console.log('❌ Failed to create test order. Skipping delete test.');
        return;
      }
      
      console.log('✅ Created test order for deletion');
    }
    
    // Test delete all orders
    console.log('🗑️  Testing delete all orders...');
    const deleteResponse = await fetch(`${BASE_URL}/api/orders/delete-all`, {
      method: 'DELETE',
      headers: {
        'Cookie': 'auth-token=your-admin-token-here' // You'll need to replace this with a real token
      }
    });
    
    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log('✅ Delete all orders successful');
      console.log(`📊 Response: ${deleteData.message}`);
      console.log(`🔢 Deleted count: ${deleteData.deletedCount}`);
      
      // Verify orders are actually deleted
      console.log('🔍 Verifying orders were deleted...');
      const verifyResponse = await fetch(`${BASE_URL}/api/orders`, {
        headers: {
          'Cookie': 'auth-token=your-admin-token-here'
        }
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        const remainingOrders = verifyData.orders ? verifyData.orders.length : 0;
        
        if (remainingOrders === 0) {
          console.log('✅ Verification successful: All orders deleted');
        } else {
          console.log(`❌ Verification failed: ${remainingOrders} orders still exist`);
        }
      } else {
        console.log('❌ Failed to verify deletion');
      }
      
    } else {
      const errorData = await deleteResponse.json();
      console.log('❌ Delete all orders failed');
      console.log('Response status:', deleteResponse.status);
      console.log('Error:', errorData.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

async function testValidation() {
  console.log('\n🔍 Testing validation and edge cases...');
  
  const testCases = [
    {
      name: 'Unauthorized access (no token)',
      headers: {},
      expectedStatus: 401
    },
    {
      name: 'Non-admin access',
      headers: { 'Cookie': 'auth-token=non-admin-token' },
      expectedStatus: 403
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.name}`);
      const response = await fetch(`${BASE_URL}/api/orders/delete-all`, {
        method: 'DELETE',
        headers: testCase.headers
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
  console.log('🚀 Starting delete all orders tests...\n');
  
  await testDeleteAllOrders();
  await testValidation();
  
  console.log('\n✨ Tests completed!');
  console.log('\n📝 Note: To run this test properly, you need to:');
  console.log('1. Make sure the dev server is running on port 6600');
  console.log('2. Replace "your-admin-token-here" with a real admin auth token');
  console.log('3. Have proper database setup with contacts and products for test order creation');
}

if (require.main === module) {
  runTests();
}

module.exports = { testDeleteAllOrders, testValidation };
