#!/usr/bin/env node

/**
 * Test script to verify free shipping functionality
 */

const { ShippingService } = require('../src/lib/services/shipping.ts');
const { ProductModel } = require('../src/lib/models/index.ts');

async function testFreeShipping() {
  console.log('Testing free shipping functionality...\n');

  // Test data
  const testAddress = {
    address: '123 Test St',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84101'
  };

  try {
    // Test 1: Product with free shipping
    console.log('Test 1: Product with free shipping enabled');
    
    // Create a mock product with free shipping
    const mockProductWithFreeShipping = {
      id: 'test-product-1',
      name: 'Test Product with Free Shipping',
      shipping_methods: [
        {
          type: 'free',
          name: 'Free Shipping',
          description: 'Free standard shipping (5-7 business days)'
        },
        {
          type: 'fixed',
          name: 'Express Shipping',
          description: 'Express shipping (1-2 business days)',
          cost: 29.99
        }
      ]
    };

    // Mock ProductModel.getById for this test
    const originalGetById = ProductModel.getById;
    ProductModel.getById = async (id) => {
      if (id === 'test-product-1') {
        return mockProductWithFreeShipping;
      }
      return originalGetById(id);
    };

    const cartItems = [
      { productId: 'test-product-1', quantity: 1 }
    ];

    const result = await ShippingService.calculateCartShipping(cartItems, testAddress);
    
    console.log('Available shipping methods:');
    result.methods.forEach(method => {
      console.log(`- ${method.name}: $${method.cost.toFixed(2)}`);
    });

    const hasFreeShipping = result.methods.some(method => method.cost === 0);
    console.log(`\nFree shipping available: ${hasFreeShipping ? 'YES' : 'NO'}`);
    
    if (hasFreeShipping) {
      console.log('✅ Test 1 PASSED: Free shipping is available when product has free shipping\n');
    } else {
      console.log('❌ Test 1 FAILED: Free shipping should be available\n');
    }

    // Test 2: Mixed cart (one product with free shipping, one without)
    console.log('Test 2: Mixed cart with free and paid shipping products');
    
    const mockProductWithoutFreeShipping = {
      id: 'test-product-2',
      name: 'Test Product without Free Shipping',
      shipping_methods: [
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
        }
      ]
    };

    ProductModel.getById = async (id) => {
      if (id === 'test-product-1') {
        return mockProductWithFreeShipping;
      }
      if (id === 'test-product-2') {
        return mockProductWithoutFreeShipping;
      }
      return originalGetById(id);
    };

    const mixedCartItems = [
      { productId: 'test-product-1', quantity: 1 },
      { productId: 'test-product-2', quantity: 1 }
    ];

    const mixedResult = await ShippingService.calculateCartShipping(mixedCartItems, testAddress);
    
    console.log('Available shipping methods for mixed cart:');
    mixedResult.methods.forEach(method => {
      console.log(`- ${method.name}: $${method.cost.toFixed(2)}`);
    });

    const mixedHasFreeShipping = mixedResult.methods.some(method => method.cost === 0);
    console.log(`\nFree shipping available: ${mixedHasFreeShipping ? 'YES' : 'NO'}`);
    
    if (mixedHasFreeShipping) {
      console.log('✅ Test 2 PASSED: Free shipping is available when at least one product has free shipping\n');
    } else {
      console.log('❌ Test 2 FAILED: Free shipping should be available when at least one product has free shipping\n');
    }

    // Restore original function
    ProductModel.getById = originalGetById;

    console.log('Free shipping tests completed!');

  } catch (error) {
    console.error('Error running free shipping tests:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testFreeShipping();
}

module.exports = { testFreeShipping };
