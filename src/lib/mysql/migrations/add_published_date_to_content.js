require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function addPublishedDateToContent() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  });

  try {
    console.log('Adding published_date column to content table...');
    
    // Add the published_date column
    await connection.execute(`
      ALTER TABLE content 
      ADD COLUMN published_date TIMESTAMP NULL DEFAULT NULL
      AFTER published
    `);
    
    // Set published_date to created_at for existing published content
    await connection.execute(`
      UPDATE content 
      SET published_date = created_at 
      WHERE published = TRUE AND published_date IS NULL
    `);
    
    console.log('Successfully added published_date column to content table');
  } catch (error) {
    console.error('Error adding published_date column:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  addPublishedDateToContent()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addPublishedDateToContent;
