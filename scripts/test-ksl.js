#!/usr/bin/env node

/**
 * Test script for KSL integration
 * This script tests the KSL service authentication and basic functionality
 */

const { KslService } = require('../src/lib/services/listing/ksl.ts');

async function testKslIntegration() {
  console.log('🧪 Testing KSL Integration...\n');

  // Mock platform object
  const mockPlatform = {
    id: 'ksl-test',
    name: 'ksl',
    display_name: 'KSL Classifieds',
    requires_auth: true,
    is_active: true,
    api_endpoint: 'https://classifieds.ksl.com',
    configuration: {
      max_title_length: 100,
      max_description_length: 4000,
      max_images: 8
    }
  };

  // Note: This test script requires credentials to be configured in the admin dashboard
  // For testing purposes, you would need to pass actual credentials here
  const mockCredentials = {
    username: 'test@example.com', // Replace with actual credentials for testing
    password: 'test-password'     // Replace with actual credentials for testing
  };

  const kslService = new KslService(mockPlatform, mockCredentials);

  console.log('📋 Testing credential validation...');
  const hasCredentials = kslService.hasRequiredCredentials();
  console.log(`✅ Has required credentials: ${hasCredentials}`);

  if (!hasCredentials) {
    console.log('❌ Missing KSL credentials. Please configure credentials in the admin dashboard.');
    console.log('   Go to Dashboard > Settings > Platforms > KSL Classifieds');
    return;
  }

  console.log('\n🔐 Testing authentication...');
  try {
    const authResult = await kslService.authenticate();
    console.log(`✅ Authentication result: ${authResult}`);
    
    if (!authResult) {
      console.log('❌ Authentication failed. Please check your KSL credentials.');
      return;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return;
  }

  console.log('\n📝 Testing listing creation...');
  
  // Mock listing data
  const testListingData = {
    title: 'Test Solar Panel - 400W Monocrystalline',
    description: 'High-efficiency solar panel perfect for residential installations. This is a test listing created by automation.',
    price: 299.99,
    images: [], // No images for test
    category: 'solar-panels',
    condition: 'new',
    quantity: 1,
    location: {
      city: 'Salt Lake City',
      state: 'UT',
      zipCode: '84101'
    },
    shipping: {
      available: true,
      cost: 25.00
    }
  };

  try {
    console.log('Creating test listing...');
    const createResult = await kslService.createListing(testListingData);
    
    if (createResult.success) {
      console.log('✅ Listing created successfully!');
      console.log(`   Listing ID: ${createResult.listingId}`);
      console.log(`   Listing URL: ${createResult.listingUrl}`);
      
      if (createResult.warnings && createResult.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        createResult.warnings.forEach(warning => console.log(`   - ${warning}`));
      }

      // Test listing status check
      if (createResult.listingId) {
        console.log('\n📊 Testing listing status check...');
        const statusResult = await kslService.getListingStatus(createResult.listingId);
        console.log(`✅ Listing status: ${statusResult.status}`);
        if (statusResult.url) {
          console.log(`   URL: ${statusResult.url}`);
        }
      }

    } else {
      console.log('❌ Listing creation failed:');
      console.log(`   Error: ${createResult.error}`);
    }
  } catch (error) {
    console.error('❌ Listing creation error:', error.message);
  }

  console.log('\n🧹 Cleaning up...');
  // The cleanup will happen automatically when the service is destroyed
  
  console.log('\n✅ KSL integration test completed!');
}

// Run the test
if (require.main === module) {
  testKslIntegration().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testKslIntegration };
