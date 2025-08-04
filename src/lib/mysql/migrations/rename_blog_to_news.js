#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function migrateBlogToNews() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  });

  try {
    console.log('Starting blog to news migration...');

    // Update content type from 'blog' to 'news'
    const [result] = await connection.execute(`
      UPDATE content_types 
      SET name = 'news', description = 'News posts'
      WHERE name = 'blog'
    `);
    
    console.log(`✓ Updated content type: ${result.affectedRows} row(s) affected`);

    // Verify the migration
    const [verification] = await connection.execute(`
      SELECT name, description FROM content_types WHERE name = 'news'
    `);
    
    if (verification.length > 0) {
      console.log('✓ Verification successful: Content type "news" exists');
      console.log(`  Description: ${verification[0].description}`);
    } else {
      console.log('⚠️  Warning: Content type "news" not found after migration');
    }

    console.log('✅ Blog to news migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateBlogToNews().catch(console.error);
}

module.exports = migrateBlogToNews;
