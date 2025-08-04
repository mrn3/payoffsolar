const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function updateBlockTypeIcons() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  });

  try {
    console.log('Starting block type icons update migration...');

    // Update Hero Block icon from FaImage to FaBullhorn
    await connection.execute(`
      UPDATE block_types 
      SET icon = 'FaBullhorn' 
      WHERE name = 'hero' AND icon = 'FaImage'
    `);
    console.log('✓ Updated Hero Block icon to FaBullhorn');

    // Update Card Grid icon to FaThLarge (in case it's still FaTh)
    await connection.execute(`
      UPDATE block_types 
      SET icon = 'FaThLarge' 
      WHERE name = 'card_grid' AND (icon = 'FaTh' OR icon IS NULL)
    `);
    console.log('✓ Updated Card Grid icon to FaThLarge');

    console.log('✅ Block type icons migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  updateBlockTypeIcons().catch(console.error);
}

module.exports = updateBlockTypeIcons;
