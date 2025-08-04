#!/usr/bin/env node

/**
 * Script to check and fix news content type issues
 * This script will:
 * 1. Check if the news content type exists
 * 2. If not, run the blog-to-news migration
 * 3. Verify the fix worked
 */

// Load environment variables
const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
  console.log('📄 Loaded environment from .env.local');
} else if (fs.existsSync('.env')) {
  require('dotenv').config({ path: '.env' });
  console.log('📄 Loaded environment from .env');
} else {
  console.log('⚠️  No .env.local or .env file found, using system environment variables');
}

const mysql = require('mysql2/promise');
const path = require('path');

async function checkAndFixNews() {
  let connection;
  
  try {
    console.log('=== Checking News Content Type ===');
    console.log('Environment variables:');
    console.log(`MYSQL_HOST: ${process.env.MYSQL_HOST}`);
    console.log(`MYSQL_PORT: ${process.env.MYSQL_PORT}`);
    console.log(`MYSQL_USER: ${process.env.MYSQL_USER}`);
    console.log(`MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD ? '[SET]' : '[EMPTY]'}`);
    console.log(`MYSQL_DATABASE: ${process.env.MYSQL_DATABASE}`);
    console.log('');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar'
    });

    console.log('✅ Database connection successful');

    // Check if news content type exists
    const [newsType] = await connection.execute('SELECT * FROM content_types WHERE name = ?', ['news']);
    
    if (newsType.length > 0) {
      console.log('✅ News content type already exists:', newsType[0]);
      
      // Check for published news content
      const newsTypeId = newsType[0].id;
      const [publishedNews] = await connection.execute(
        'SELECT COUNT(*) as count FROM content WHERE type_id = ? AND published = TRUE',
        [newsTypeId]
      );
      
      console.log(`✅ Found ${publishedNews[0].count} published news items`);
      
      if (publishedNews[0].count === 0) {
        console.log('⚠️  No published news content found. You may need to create some news posts.');
      }
      
      return;
    }

    console.log('❌ News content type not found. Checking for blog content type...');

    // Check if blog content type exists
    const [blogType] = await connection.execute('SELECT * FROM content_types WHERE name = ?', ['blog']);
    
    if (blogType.length === 0) {
      console.log('❌ No blog content type found either. Creating news content type...');
      
      // Create news content type
      await connection.execute(`
        INSERT INTO content_types (id, name, description) 
        VALUES (UUID(), 'news', 'News posts')
      `);
      
      console.log('✅ Created news content type');
    } else {
      console.log('✅ Found blog content type. Running migration...');
      
      // Run the blog to news migration
      const [result] = await connection.execute(`
        UPDATE content_types 
        SET name = 'news', description = 'News posts'
        WHERE name = 'blog'
      `);
      
      console.log(`✅ Migration completed: ${result.affectedRows} row(s) affected`);
    }

    // Verify the fix
    const [verifyNews] = await connection.execute('SELECT * FROM content_types WHERE name = ?', ['news']);
    
    if (verifyNews.length > 0) {
      console.log('✅ Verification successful: News content type now exists');
      
      // Check for content with this type
      const newsTypeId = verifyNews[0].id;
      const [newsContent] = await connection.execute(
        'SELECT COUNT(*) as count FROM content WHERE type_id = ?',
        [newsTypeId]
      );
      
      console.log(`✅ Found ${newsContent[0].count} total news items`);
      
      const [publishedNews] = await connection.execute(
        'SELECT COUNT(*) as count FROM content WHERE type_id = ? AND published = TRUE',
        [newsTypeId]
      );
      
      console.log(`✅ Found ${publishedNews[0].count} published news items`);
      
      if (publishedNews[0].count === 0) {
        console.log('⚠️  No published news content found. You may need to create some news posts or publish existing ones.');
      }
    } else {
      console.log('❌ Verification failed: News content type still not found');
    }

    console.log('\n✅ News content type check and fix completed');

  } catch (error) {
    console.error('❌ Check and fix failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAndFixNews();
