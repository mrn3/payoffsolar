#!/usr/bin/env node

/**
 * Comprehensive script to diagnose and fix news content issues on the server
 * This script will:
 * 1. Test database connection
 * 2. Check environment variables
 * 3. Verify content types exist
 * 4. Test the exact API call that fails
 * 5. Fix any issues found
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

async function diagnoseServerNews() {
  let connection;
  
  try {
    console.log('=== Server News Diagnosis ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Node Environment:', process.env.NODE_ENV || 'not set');
    console.log('');

    // Step 1: Check environment variables
    console.log('=== Environment Variables ===');
    console.log(`MYSQL_HOST: ${process.env.MYSQL_HOST || 'not set'}`);
    console.log(`MYSQL_PORT: ${process.env.MYSQL_PORT || 'not set'}`);
    console.log(`MYSQL_USER: ${process.env.MYSQL_USER || 'not set'}`);
    console.log(`MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD ? '[SET]' : '[NOT SET]'}`);
    console.log(`MYSQL_DATABASE: ${process.env.MYSQL_DATABASE || 'not set'}`);
    console.log('');

    // Step 2: Test database connection
    console.log('=== Database Connection Test ===');
    try {
      connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'payoffsolar'
      });

      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      console.error('Full error:', dbError);
      return;
    }

    // Step 3: Check database tables exist
    console.log('\n=== Database Tables Check ===');
    try {
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`✅ Found ${tables.length} tables in database`);
      
      const tableNames = tables.map(row => Object.values(row)[0]);
      const requiredTables = ['content_types', 'content', 'profiles', 'users'];
      
      for (const table of requiredTables) {
        if (tableNames.includes(table)) {
          console.log(`✅ Table '${table}' exists`);
        } else {
          console.log(`❌ Table '${table}' missing`);
        }
      }
    } catch (tableError) {
      console.error('❌ Error checking tables:', tableError.message);
    }

    // Step 4: Check content types
    console.log('\n=== Content Types Check ===');
    try {
      const [contentTypes] = await connection.execute('SELECT * FROM content_types ORDER BY name');
      console.log(`Found ${contentTypes.length} content types:`);
      contentTypes.forEach(type => {
        console.log(`  - ${type.name}: ${type.description} (ID: ${type.id})`);
      });

      // Check specifically for news
      const newsType = contentTypes.find(type => type.name === 'news');
      if (!newsType) {
        console.log('\n❌ NEWS CONTENT TYPE NOT FOUND!');
        
        // Check for blog type
        const blogType = contentTypes.find(type => type.name === 'blog');
        if (blogType) {
          console.log('✅ Found blog content type, running migration...');
          await connection.execute(`
            UPDATE content_types 
            SET name = 'news', description = 'News posts'
            WHERE name = 'blog'
          `);
          console.log('✅ Migrated blog to news');
        } else {
          console.log('❌ No blog type found either, creating news type...');
          await connection.execute(`
            INSERT INTO content_types (id, name, description) 
            VALUES (UUID(), 'news', 'News posts')
          `);
          console.log('✅ Created news content type');
        }
      } else {
        console.log('\n✅ News content type exists:', newsType);
      }
    } catch (contentTypeError) {
      console.error('❌ Error checking content types:', contentTypeError.message);
    }

    // Step 5: Test the exact API query
    console.log('\n=== API Query Simulation ===');
    try {
      // Simulate ContentTypeModel.getByName('news')
      const [newsTypeResult] = await connection.execute('SELECT * FROM content_types WHERE name = ?', ['news']);
      
      if (newsTypeResult.length === 0) {
        console.log('❌ ContentTypeModel.getByName("news") would return null');
        console.log('This explains the "Invalid content type" error');
      } else {
        const newsType = newsTypeResult[0];
        console.log(`✅ ContentTypeModel.getByName("news") returns: ${newsType.id}`);
        
        // Simulate ContentModel.getPublishedByType
        const [contentResult] = await connection.execute(
          `SELECT c.*, ct.name as type_name,
           CONCAT(p.first_name, ' ', p.last_name) as author_name
           FROM content c
           LEFT JOIN content_types ct ON c.type_id = ct.id
           LEFT JOIN profiles p ON c.author_id = p.id
           WHERE c.published = TRUE AND c.type_id = ?
           ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
          [newsType.id, 10, 0]
        );
        
        console.log(`✅ ContentModel.getPublishedByType would return ${contentResult.length} items`);
        
        if (contentResult.length === 0) {
          console.log('⚠️  No published news content found');
          
          // Check for unpublished content
          const [unpublishedResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM content WHERE type_id = ? AND published = FALSE',
            [newsType.id]
          );
          
          if (unpublishedResult[0].count > 0) {
            console.log(`⚠️  Found ${unpublishedResult[0].count} unpublished news items`);
            console.log('Consider publishing some content or creating new news posts');
          } else {
            console.log('⚠️  No news content found at all');
            console.log('You need to create some news posts in the admin panel');
          }
        } else {
          console.log('✅ Published news content found:');
          contentResult.forEach(item => {
            console.log(`  - ${item.title} (Slug: ${item.slug})`);
          });
        }
      }
    } catch (apiError) {
      console.error('❌ API query simulation failed:', apiError.message);
    }

    // Step 6: Test count query
    console.log('\n=== Count Query Test ===');
    try {
      const [newsTypeResult] = await connection.execute('SELECT * FROM content_types WHERE name = ?', ['news']);
      if (newsTypeResult.length > 0) {
        const newsType = newsTypeResult[0];
        const [countResult] = await connection.execute(
          'SELECT COUNT(*) as count FROM content WHERE published = TRUE AND type_id = ?',
          [newsType.id]
        );
        console.log(`✅ ContentModel.getPublishedCountByType would return: ${countResult[0].count}`);
      }
    } catch (countError) {
      console.error('❌ Count query failed:', countError.message);
    }

    console.log('\n=== Diagnosis Complete ===');
    console.log('If the news page is still failing after running this script,');
    console.log('the issue might be with the Next.js build or server configuration.');
    console.log('Try rebuilding the application: yarn build && pm2 restart payoffsolar');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

diagnoseServerNews();
