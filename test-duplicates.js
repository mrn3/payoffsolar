// Test script to verify product duplicate detection functionality
const { findProductDuplicates, calculateProductSimilarity } = require('./src/lib/utils/duplicates.ts');

// Mock test products that should be detected as duplicates
const testProducts = [
  {
    id: '1',
    name: 'Test Solar Panel 300W',
    description: 'High efficiency solar panel for residential use',
    price: 250.00,
    sku: 'TSP-300W-TEST',
    is_active: true,
    created_at: '2025-01-22T10:00:00Z',
    updated_at: '2025-01-22T10:00:00Z'
  },
  {
    id: '2', 
    name: 'Test Solar Panel 300W Duplicate',
    description: 'High efficiency solar panel for residential applications',
    price: 250.00,
    sku: 'TSP-300W-DUP',
    is_active: true,
    created_at: '2025-01-22T10:05:00Z',
    updated_at: '2025-01-22T10:05:00Z'
  },
  {
    id: '3',
    name: 'Different Inverter 5kW',
    description: 'String inverter for commercial applications',
    price: 1200.00,
    sku: 'INV-5KW-COMM',
    is_active: true,
    created_at: '2025-01-22T10:10:00Z',
    updated_at: '2025-01-22T10:10:00Z'
  }
];

console.log('Testing product duplicate detection...');

// Test similarity calculation
const similarity = calculateProductSimilarity(testProducts[0], testProducts[1]);
console.log('Similarity between test products:', similarity);

// Test duplicate detection
const duplicates = findProductDuplicates(testProducts, 70);
console.log('Duplicate groups found:', duplicates);

if (duplicates.length > 0) {
  console.log('✅ Duplicate detection working correctly!');
  console.log(`Found ${duplicates.length} duplicate group(s)`);
  duplicates.forEach((group, index) => {
    console.log(`Group ${index + 1}:`);
    console.log(`  Match type: ${group.matchType}`);
    console.log(`  Similarity: ${group.similarityScore}%`);
    console.log(`  Products: ${group.products.map(p => p.name).join(', ')}`);
  });
} else {
  console.log('❌ No duplicates detected - check threshold or similarity logic');
}
