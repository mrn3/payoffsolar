const mysql = require('mysql2/promise');

async function up() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  });

  try {
    console.log('Checking if image_url column exists in content table...');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'content' AND COLUMN_NAME = 'image_url'
    `, [process.env.MYSQL_DATABASE || 'payoffsolar']);

    if (columns.length > 0) {
      console.log('image_url column already exists in content table');
      return;
    }

    console.log('Adding image_url column to content table...');

    // Add image_url column to content table
    await connection.execute(`
      ALTER TABLE content
      ADD COLUMN image_url VARCHAR(500) AFTER content_mode
    `);

    console.log('Successfully added image_url column to content table');
  } catch (error) {
    console.error('Error adding image_url column:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function down() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  });

  try {
    console.log('Removing image_url column from content table...');
    
    // Remove image_url column from content table
    await connection.execute(`
      ALTER TABLE content 
      DROP COLUMN image_url
    `);
    
    console.log('Successfully removed image_url column from content table');
  } catch (error) {
    console.error('Error removing image_url column:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = { up, down };
