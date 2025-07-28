// Simple test script to check bundle functionality
const mysql = require('mysql2/promise');

async function testBundle() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin123',
    database: 'payoffsolar'
  });

  try {
    // Check if there are any bundle products
    const [bundles] = await connection.execute(
      'SELECT id, name, sku FROM products WHERE is_bundle = TRUE LIMIT 5'
    );
    
    console.log('Existing bundle products:', bundles);
    
    if (bundles.length > 0) {
      // Test the updated query
      const bundleId = bundles[0].id;
      console.log(`\nTesting bundle: ${bundles[0].name} (${bundles[0].sku})`);
      
      const [bundleItems] = await connection.execute(`
        SELECT pbi.*, p.name as component_product_name, p.sku as component_product_sku,
                p.price as component_product_price, p.description as component_product_description,
                COALESCE(
                  (SELECT pi.image_url FROM product_images pi
                   WHERE pi.product_id = p.id
                   ORDER BY pi.sort_order ASC, pi.created_at ASC
                   LIMIT 1),
                  p.image_url
                ) as component_product_image_url
         FROM product_bundle_items pbi
         LEFT JOIN products p ON pbi.component_product_id = p.id
         WHERE pbi.bundle_product_id = ?
         ORDER BY pbi.sort_order ASC, pbi.created_at ASC
      `, [bundleId]);
      
      console.log('Bundle items with new fields:');
      bundleItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.component_product_name}`);
        console.log(`     SKU: ${item.component_product_sku}`);
        console.log(`     Price: $${item.component_product_price}`);
        console.log(`     Description: ${item.component_product_description ? item.component_product_description.substring(0, 100) + '...' : 'No description'}`);
        console.log(`     Image: ${item.component_product_image_url || 'No image'}`);
        console.log(`     Quantity: ${item.quantity}`);
        console.log('');
      });
    } else {
      console.log('No bundle products found. You may need to create one in the admin dashboard.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testBundle();
