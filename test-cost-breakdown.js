// Simple test script to verify the cost breakdown API with category filtering
const fetch = require('node-fetch');

async function testCostBreakdownAPI() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    console.log('Testing cost breakdown API...');
    
    // Test 1: Get all cost breakdown data
    console.log('\n1. Testing all categories:');
    const allResponse = await fetch(`${baseUrl}/api/orders/cost-breakdown-by-month`);
    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log(`✓ All categories: ${allData.length} records`);
      if (allData.length > 0) {
        console.log(`  Sample: ${allData[0].month} - ${allData[0].category_name}: $${allData[0].total_amount}`);
      }
    } else {
      console.log(`✗ Error: ${allResponse.status}`);
    }
    
    // Test 2: Get cost categories
    console.log('\n2. Testing cost categories:');
    const categoriesResponse = await fetch(`${baseUrl}/api/cost-categories`);
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log(`✓ Categories: ${categoriesData.categories?.length || 0} found`);
      
      if (categoriesData.categories && categoriesData.categories.length > 0) {
        const firstCategory = categoriesData.categories[0];
        console.log(`  First category: ${firstCategory.name} (ID: ${firstCategory.id})`);
        
        // Test 3: Filter by first category
        console.log('\n3. Testing category filtering:');
        const filteredResponse = await fetch(`${baseUrl}/api/orders/cost-breakdown-by-month?categoryId=${firstCategory.id}`);
        if (filteredResponse.ok) {
          const filteredData = await filteredResponse.json();
          console.log(`✓ Filtered by "${firstCategory.name}": ${filteredData.length} records`);
          if (filteredData.length > 0) {
            console.log(`  Sample: ${filteredData[0].month} - ${filteredData[0].category_name}: $${filteredData[0].total_amount}`);
          }
        } else {
          console.log(`✗ Filter error: ${filteredResponse.status}`);
        }
      }
    } else {
      console.log(`✗ Categories error: ${categoriesResponse.status}`);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testCostBreakdownAPI();
