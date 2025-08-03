const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function addContentModeColumn() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  });

  try {
    console.log('Starting content_mode column migration...');

    // Check if content_mode column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'content' 
      AND COLUMN_NAME = 'content_mode'
    `);

    if (columns.length === 0) {
      // Add content_mode column
      await connection.execute(`
        ALTER TABLE content 
        ADD COLUMN content_mode ENUM('rich_text', 'blocks') DEFAULT 'rich_text' AFTER content
      `);
      console.log('✓ Added content_mode column to content table');

      // Update existing records to have 'rich_text' mode
      await connection.execute(`
        UPDATE content SET content_mode = 'rich_text' WHERE content_mode IS NULL
      `);
      console.log('✓ Updated existing content records to use rich_text mode');
    } else {
      console.log('✓ content_mode column already exists in content table');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  addContentModeColumn().catch(console.error);
}

module.exports = addContentModeColumn;
