const fs = require('fs');
const path = require('path');

// Test data that matches your CSV structure
const testOrderItems = [
  {
    notes: 'S00264',
    order_date: '2025-06-12',
    contact_name: 'Preston Gregory',
    price: '160.00',
    status: 'Sales Order',
    product_name: 'Gstar 365 Watt Solar Panel - Black Bifacial - GSP6G60M-365BT',
    quantity: '1'
  },
  {
    notes: 'S00263',
    order_date: '2025-06-12',
    contact_name: 'Chris Jepsen',
    price: '360.00',
    status: 'Sales Order',
    product_name: 'Gstar 365 Watt Solar Panel - Black Bifacial - GSP6G60M-365BT',
    quantity: '1'
  },
  {
    notes: 'S00259',
    order_date: '2025-06-09',
    contact_name: 'Paul Shipley',
    price: '360.00',
    status: 'Sales Order',
    product_name: 'Gstar 365 Watt Solar Panel - Black Bifacial - GSP6G60M-365BT',
    quantity: '1'
  }
];

async function testImport() {
  try {
    console.log('Testing order import with', testOrderItems.length, 'items...');
    
    const response = await fetch('http://localhost:6600/api/orders/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NmIyNGU3NC0zZDUxLTExZjAtYTgwNy1hMmEwMmViZDRhMTQiLCJpYXQiOjE3NDk2NzUzMTcsImV4cCI6MTc1MDI4MDExN30.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
      },
      body: JSON.stringify({ orderItems: testOrderItems })
    });

    const result = await response.json();
    console.log('Import result:', result);
    
    if (response.ok) {
      console.log('✅ Import successful!');
      console.log(`📊 Success: ${result.success}, Errors: ${result.errors}, Total Processed: ${result.totalProcessed}`);
      
      if (result.errorDetails && result.errorDetails.length > 0) {
        console.log('❌ Error details:');
        result.errorDetails.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
    } else {
      console.log('❌ Import failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImport();
