const fs = require('fs');
const mysql = require('mysql2/promise');

async function testFullImport() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'payoffsolar'
  });

  try {
    console.log('🔍 Testing full CSV import...');
    
    // Read and parse CSV file
    const csvContent = fs.readFileSync('full_orders.csv', 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    console.log(`📊 CSV file has ${lines.length} lines (including header)`);
    console.log(`📋 Headers: ${headers.join(', ')}`);
    
    const orderItems = [];
    
    // Parse CSV data (skip header)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const item = {
        notes: values[0], // Order Reference
        order_date: values[1], // Order Date
        contact_name: values[2], // Contact Name
        price: values[3], // Price
        status: values[4], // Status
        product_name: values[5], // Product Name
        quantity: values[6] // Quantity
      };
      orderItems.push(item);
    }
    
    console.log(`📦 Parsed ${orderItems.length} order items`);
    
    // Simulate the grouping logic from the import route
    const orderGroups = new Map();
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      
      try {
        console.log(`\n🔄 Processing item ${i + 1}/${orderItems.length}: ${item.notes}`);

        // Find or create contact
        const [contacts] = await connection.execute(
          'SELECT * FROM contacts WHERE name = ? LIMIT 1',
          [item.contact_name]
        );

        let contact = contacts[0];
        if (!contact) {
          console.log(`➕ Creating new contact: ${item.contact_name}`);
          await connection.execute(
            'INSERT INTO contacts (id, name) VALUES (UUID(), ?)',
            [item.contact_name]
          );
          
          const [newContacts] = await connection.execute(
            'SELECT * FROM contacts WHERE name = ? ORDER BY created_at DESC LIMIT 1',
            [item.contact_name]
          );
          contact = newContacts[0];
        }

        // Find product (should exist)
        const [products] = await connection.execute(
          'SELECT * FROM products WHERE name = ? LIMIT 1',
          [item.product_name]
        );

        let product = products[0];
        if (!product) {
          console.log(`❌ Product not found: ${item.product_name}`);
          throw new Error(`Product not found: ${item.product_name}`);
        }

        // Validate data
        const quantity = parseInt(item.quantity);
        const price = parseFloat(item.price);

        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity: ${item.quantity}`);
        }

        if (isNaN(price) || price < 0) {
          throw new Error(`Invalid price: ${item.price}`);
        }

        // Create order group key
        const status = item.status?.trim() || 'pending';
        const notes = item.notes?.trim() || '';
        const orderDate = item.order_date;
        
        const orderKey = notes ? 
          `${contact.id}-${status}-${orderDate}-${notes}` : 
          `${contact.id}-${status}-${orderDate}-row-${i}`;

        if (!orderGroups.has(orderKey)) {
          orderGroups.set(orderKey, {
            contact_id: contact.id,
            status: status,
            order_date: orderDate,
            notes: notes || undefined,
            items: []
          });
        }

        const orderGroup = orderGroups.get(orderKey);
        orderGroup.items.push({
          product_id: product.id,
          quantity: quantity,
          price: price
        });

        console.log(`✅ Item processed successfully`);

      } catch (error) {
        errorCount++;
        const errorMessage = `Row ${i + 1}: ${error.message}`;
        errors.push(errorMessage);
        console.error(`❌ Error processing row ${i + 1}:`, error.message);
      }
    }

    console.log(`\n📊 Processing Summary:`);
    console.log(`📦 Total items processed: ${orderItems.length}`);
    console.log(`📋 Order groups created: ${orderGroups.size}`);
    console.log(`❌ Processing errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Create orders from groups
    let orderSuccessCount = 0;
    for (const [orderKey, orderData] of orderGroups) {
      try {
        const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const [orderResult] = await connection.execute(
          'INSERT INTO orders (id, contact_id, status, total, order_date, notes) VALUES (UUID(), ?, ?, ?, ?, ?)',
          [orderData.contact_id, orderData.status, total, orderData.order_date, orderData.notes || null]
        );

        const [newOrders] = await connection.execute(
          'SELECT id FROM orders WHERE contact_id = ? AND total = ? AND order_date = ? ORDER BY created_at DESC LIMIT 1',
          [orderData.contact_id, total, orderData.order_date]
        );
        
        const orderId = newOrders[0].id;

        // Create order items
        for (const item of orderData.items) {
          await connection.execute(
            'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (UUID(), ?, ?, ?, ?)',
            [orderId, item.product_id, item.quantity, item.price]
          );
        }

        orderSuccessCount++;
        console.log(`📋 Created order ${orderSuccessCount}/${orderGroups.size}: ${orderData.notes || 'No reference'}`);

      } catch (error) {
        console.error(`❌ Error creating order:`, error.message);
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`📊 Final Results:`);
    console.log(`📦 CSV rows: ${orderItems.length}`);
    console.log(`📋 Orders created: ${orderSuccessCount}`);
    console.log(`❌ Total errors: ${errorCount}`);

    // Verify results
    const [orderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const [itemCount] = await connection.execute('SELECT COUNT(*) as count FROM order_items');
    
    console.log(`\n🔍 Database verification:`);
    console.log(`📋 Orders in database: ${orderCount[0].count}`);
    console.log(`📦 Order items in database: ${itemCount[0].count}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await connection.end();
  }
}

testFullImport();
