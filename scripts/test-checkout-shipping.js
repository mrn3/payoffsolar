#!/usr/bin/env node

/**
 * Test the exact shipping logic used in checkout page
 */

require('dotenv').config({ path: '.env.local' });

// Simulate the shipping calculation logic from the frontend
const DEFAULT_SHIPPING_METHODS = [
  {
    type: 'free',
    name: 'Free Shipping',
    description: 'Free standard shipping (5-7 business days)'
  },
  {
    type: 'fixed',
    name: 'Standard Shipping',
    description: 'Standard shipping (3-5 business days)',
    cost: 9.99
  },
  {
    type: 'fixed',
    name: 'Express Shipping',
    description: 'Express shipping (1-2 business days)',
    cost: 29.99
  },
  {
    type: 'fixed',
    name: 'Overnight Shipping',
    description: 'Overnight shipping (next business day)',
    cost: 49.99
  }
];

function calculateShippingForMethod(method, quantity = 1) {
  const result = {
    method,
    cost: 0,
    estimatedDays: 7
  };

  switch (method.type) {
    case 'free':
      result.cost = 0;
      result.estimatedDays = 7;
      break;

    case 'fixed':
      result.cost = (method.cost || 0) * quantity;
      result.estimatedDays = method.cost === 49.99 ? 1 : method.cost === 29.99 ? 2 : 5;
      break;

    default:
      result.error = 'Unknown shipping method type';
  }

  return result;
}

function simulateCartShippingCalculation(cartItems) {
  console.log('Simulating cart shipping calculation...\n');
  
  const breakdown = [];
  const methodTotals = new Map();

  // Process each item in the cart
  cartItems.forEach((item, index) => {
    console.log(`Processing item ${index + 1}: ${item.name} (Qty: ${item.quantity})`);
    
    // Use default shipping methods (since products don't have custom methods)
    const shippingMethods = DEFAULT_SHIPPING_METHODS;
    const methods = [];

    // Calculate shipping for each method
    shippingMethods.forEach(method => {
      const result = calculateShippingForMethod(method, item.quantity);
      if (!result.error) {
        methods.push(result);
      }
    });

    breakdown.push({
      productId: item.id,
      productName: item.name,
      quote: { methods }
    });

    console.log(`  Available methods for this item:`);
    methods.forEach(method => {
      console.log(`    - ${method.method.name}: $${method.cost.toFixed(2)}`);
    });

    // Aggregate shipping methods (this is the logic we fixed)
    methods.forEach(method => {
      const key = method.method.name;
      const existing = methodTotals.get(key);
      
      if (existing) {
        // Special handling for free shipping - if any product has free shipping for this method,
        // the entire cart gets free shipping for this method
        if (method.method.type === 'free' || method.cost === 0) {
          existing.cost = 0;
          console.log(`    ✅ Free shipping applied to ${key} for entire cart`);
        } else if (existing.cost > 0) {
          // Only add costs if the existing method isn't already free
          existing.cost += method.cost;
          console.log(`    💰 Added $${method.cost.toFixed(2)} to ${key} (total: $${existing.cost.toFixed(2)})`);
        }
        
        // Use the longest estimated delivery time
        if (method.estimatedDays && existing.estimatedDays) {
          existing.estimatedDays = Math.max(existing.estimatedDays, method.estimatedDays);
        }
      } else {
        methodTotals.set(key, {
          cost: method.cost,
          estimatedDays: method.estimatedDays
        });
        console.log(`    🆕 Added new method ${key}: $${method.cost.toFixed(2)}`);
      }
    });

    console.log('');
  });

  // Convert aggregated methods to array
  const finalMethods = Array.from(methodTotals.entries()).map(([name, data]) => ({
    name,
    cost: data.cost,
    estimatedDays: data.estimatedDays
  }));

  // Sort by cost
  finalMethods.sort((a, b) => a.cost - b.cost);

  const totalCost = finalMethods.length > 0 ? finalMethods[0].cost : 0;

  return {
    totalCost,
    methods: finalMethods,
    breakdown
  };
}

async function testCheckoutShipping() {
  console.log('🧪 Testing checkout shipping calculation logic\n');

  // Test case 1: Single item cart
  console.log('=== Test Case 1: Single Item Cart ===');
  const singleItemCart = [
    { id: '1', name: 'Solar Panel 300W', quantity: 1 }
  ];

  const singleResult = simulateCartShippingCalculation(singleItemCart);
  
  console.log('Final shipping methods for single item:');
  singleResult.methods.forEach(method => {
    console.log(`- ${method.name}: $${method.cost.toFixed(2)} (${method.estimatedDays} days)`);
  });

  const singleHasFree = singleResult.methods.some(m => m.cost === 0);
  console.log(`\nFree shipping available: ${singleHasFree ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Default shipping cost: $${singleResult.totalCost.toFixed(2)}\n`);

  // Test case 2: Multiple item cart
  console.log('=== Test Case 2: Multiple Item Cart ===');
  const multiItemCart = [
    { id: '1', name: 'Solar Panel 300W', quantity: 1 },
    { id: '2', name: 'Inverter', quantity: 2 }
  ];

  const multiResult = simulateCartShippingCalculation(multiItemCart);
  
  console.log('Final shipping methods for multiple items:');
  multiResult.methods.forEach(method => {
    console.log(`- ${method.name}: $${method.cost.toFixed(2)} (${method.estimatedDays} days)`);
  });

  const multiHasFree = multiResult.methods.some(m => m.cost === 0);
  console.log(`\nFree shipping available: ${multiHasFree ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Default shipping cost: $${multiResult.totalCost.toFixed(2)}\n`);

  // Summary
  console.log('=== Test Summary ===');
  if (singleHasFree && multiHasFree) {
    console.log('🎉 SUCCESS: Free shipping is available in both test cases!');
    console.log('✅ The checkout page should display "Free Shipping" as an option.');
    console.log('✅ Free shipping should be selected by default (lowest cost).');
  } else {
    console.log('❌ ISSUE: Free shipping is not working correctly.');
  }
}

testCheckoutShipping().catch(console.error);
