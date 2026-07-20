const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  });

  console.log('Searching for any Waaree orders mentioning "36"...');

  const [rows] = await connection.execute(`
    SELECT
        o.id as order_id,
        o.order_date,
        o.status,
        c.name as contact_name,
        p.name as product_name,
        oi.quantity,
        oi.price,
        o.notes,
        o.total
    FROM orders o
    JOIN contacts c ON o.contact_id = c.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE p.name LIKE '%Waaree%'
      AND (oi.price LIKE '%36%' OR oi.quantity LIKE '%36%' OR o.notes LIKE '%36%' OR o.total LIKE '%36%')
    ORDER BY o.order_date DESC
    LIMIT 20
  `);

  if (rows.length === 0) {
    console.log('No exact matches for 36 in price or quantity. Searching all recent Waaree orders...');
    const [allWaaree] = await connection.execute(`
      SELECT
          o.id as order_id,
          o.order_date,
          o.status,
          c.name as contact_name,
          p.name as product_name,
          oi.quantity,
          oi.price
      FROM orders o
      JOIN contacts c ON o.contact_id = c.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.name LIKE '%Waaree%'
      ORDER BY o.order_date DESC
      LIMIT 20
    `);
    console.table(allWaaree);
  } else {
    console.table(rows);
  }

  await connection.end();
}

main().catch(console.error);
