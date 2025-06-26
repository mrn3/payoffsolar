// Simple test script to verify smart merge functionality
const { smartMergeContacts, smartMergeProducts, smartMergeOrders } = require('./src/lib/utils/duplicates.ts');

// Test contact merging
console.log('Testing Contact Merging:');
const contact1 = {
  id: '1',
  name: 'John Doe',
  email: '',
  phone: '555-1234',
  address: '123 Main St',
  city: '',
  state: 'CA',
  zip: '90210',
  notes: '',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const contact2 = {
  id: '2',
  name: '',
  email: 'john@example.com',
  phone: '',
  address: '',
  city: 'Los Angeles',
  state: '',
  zip: '',
  notes: 'VIP customer',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z' // More recent
};

const mergedContact = smartMergeContacts(contact1, contact2);
console.log('Merged Contact:', mergedContact);
console.log('Expected: name from contact1, email from contact2, phone from contact1, city from contact2, state from contact2 (more recent), etc.');

// Test product merging
console.log('\nTesting Product Merging:');
const product1 = {
  id: '1',
  name: 'Solar Panel',
  description: '',
  price: 299.99,
  image_url: 'panel1.jpg',
  data_sheet_url: '',
  category_id: 'cat1',
  sku: 'SP-001',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const product2 = {
  id: '2',
  name: '',
  description: 'High efficiency solar panel',
  price: 0,
  image_url: '',
  data_sheet_url: 'datasheet.pdf',
  category_id: '',
  sku: '',
  is_active: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z' // More recent
};

const mergedProduct = smartMergeProducts(product1, product2);
console.log('Merged Product:', mergedProduct);
console.log('Expected: name from product1, description from product2, price from product1, is_active from product2 (more recent), etc.');

// Test order merging
console.log('\nTesting Order Merging:');
const order1 = {
  id: '1',
  contact_id: 'contact1',
  status: 'proposed',
  total: 1500.00,
  order_date: '2024-01-01',
  notes: '',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const order2 = {
  id: '2',
  contact_id: '',
  status: '',
  total: 0,
  order_date: '',
  notes: 'Rush order',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z' // More recent
};

const mergedOrder = smartMergeOrders(order1, order2);
console.log('Merged Order:', mergedOrder);
console.log('Expected: contact_id from order1, status from order1, total from order1, notes from order2, etc.');
