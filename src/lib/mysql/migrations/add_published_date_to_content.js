// Load environment variables from .env file (production) or .env.local (development)
const fs = require('fs');
if (fs.existsSync('.env')) {
  require('dotenv').config({ path: '.env' });
} else if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
}
const mysql = require('mysql2/promise');

async function addPublishedDateToContent() {
  // For Bitnami servers, try different connection methods
  const connectionOptions = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar',
    socketPath: process.env.MYSQL_SOCKET || '/opt/bitnami/mysql/tmp/mysql.sock'
  };

  // Remove socketPath if password is provided
  if (process.env.MYSQL_PASSWORD) {
    delete connectionOptions.socketPath;
  }

  const connection = await mysql.createConnection(connectionOptions);

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
