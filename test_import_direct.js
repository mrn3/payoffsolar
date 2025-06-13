// Direct test of the import logic
const mysql = require('mysql2/promise');

async function testImportLogic() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'payoffsolar'
  });

  try {
    console.log('🔍 Testing import logic...');
    
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

    console.log(`📊 Processing ${testOrderItems.length} test items...`);

    // Simulate the grouping logic from the import route
    const orderGroups = new Map();
    const contactCache = new Map();
    const productCache = new Map();

    for (let i = 0; i < testOrderItems.length; i++) {
      const item = testOrderItems[i];
      console.log(`\n🔄 Processing item ${i + 1}:`, item);

      // Find contact by name
      const [contacts] = await connection.execute(
        'SELECT * FROM contacts WHERE name = ? LIMIT 1',
        [item.contact_name]
      );

      let contact = contacts[0];
      if (!contact) {
        console.log(`➕ Creating new contact: ${item.contact_name}`);
        const [result] = await connection.execute(
          'INSERT INTO contacts (id, name) VALUES (UUID(), ?)',
          [item.contact_name]
        );
        
        const [newContacts] = await connection.execute(
          'SELECT * FROM contacts WHERE name = ? ORDER BY created_at DESC LIMIT 1',
          [item.contact_name]
        );
        contact = newContacts[0];
      }

      console.log(`👤 Contact found/created: ${contact.id} - ${contact.name}`);

      // Find product by name
      const [products] = await connection.execute(
        'SELECT * FROM products WHERE name = ? LIMIT 1',
        [item.product_name]
      );

      let product = products[0];
      if (!product) {
        console.log(`➕ Creating new product: ${item.product_name}`);
        const [result] = await connection.execute(
          'INSERT INTO products (id, name, sku, price) VALUES (UUID(), ?, ?, ?)',
          [item.product_name, `AUTO-${Date.now()}`, parseFloat(item.price)]
        );
        
        const [newProducts] = await connection.execute(
          'SELECT * FROM products WHERE name = ? ORDER BY created_at DESC LIMIT 1',
          [item.product_name]
        );
        product = newProducts[0];
      }

      console.log(`📦 Product found/created: ${product.id} - ${product.name}`);

      // Create order group key
      const status = item.status?.trim() || 'pending';
      const notes = item.notes?.trim() || '';
      const orderDate = item.order_date;
      
      const orderKey = notes ? 
        `${contact.id}-${status}-${orderDate}-${notes}` : 
        `${contact.id}-${status}-${orderDate}-row-${i}`;

      console.log(`🔑 Order key: ${orderKey}`);

      if (!orderGroups.has(orderKey)) {
        orderGroups.set(orderKey, {
          contact_id: contact.id,
          status: status,
          order_date: orderDate,
          notes: notes || undefined,
          items: []
        });
        console.log(`📝 Created new order group`);
      }

      const orderGroup = orderGroups.get(orderKey);
      orderGroup.items.push({
        product_id: product.id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      });

      console.log(`✅ Added item to order group (${orderGroup.items.length} items total)`);
    }

    console.log(`\n📊 Summary: ${testOrderItems.length} items processed into ${orderGroups.size} order groups`);

    // Create orders from groups
    let successCount = 0;
    for (const [orderKey, orderData] of orderGroups) {
      console.log(`\n🏗️ Creating order for key: ${orderKey}`);
      
      const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      console.log(`💰 Total: $${total}`);

      const [orderResult] = await connection.execute(
        'INSERT INTO orders (id, contact_id, status, total, order_date, notes) VALUES (UUID(), ?, ?, ?, ?, ?)',
        [orderData.contact_id, orderData.status, total, orderData.order_date, orderData.notes || null]
      );

      const [newOrders] = await connection.execute(
        'SELECT id FROM orders WHERE contact_id = ? AND total = ? AND order_date = ? ORDER BY created_at DESC LIMIT 1',
        [orderData.contact_id, total, orderData.order_date]
      );
      
      const orderId = newOrders[0].id;
      console.log(`📋 Created order: ${orderId}`);

      // Create order items
      for (const item of orderData.items) {
        await connection.execute(
          'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (UUID(), ?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price]
        );
        console.log(`📦 Added item: ${item.quantity}x ${item.product_id} @ $${item.price}`);
      }

      successCount++;
    }

    console.log(`\n✅ Import completed successfully!`);
    console.log(`📊 Final results: ${successCount} orders created from ${testOrderItems.length} items`);

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

testImportLogic();
