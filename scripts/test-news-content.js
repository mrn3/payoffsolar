#!/usr/bin/env node

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

async function testNewsContent() {
  let connection;
  
  try {
    console.log('=== Testing News Content ===');
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

    // Check content types
    console.log('\n=== Content Types ===');
    const [contentTypes] = await connection.execute('SELECT * FROM content_types ORDER BY name');
    console.log(`Found ${contentTypes.length} content types:`);
    contentTypes.forEach(type => {
      console.log(`  - ${type.name}: ${type.description} (ID: ${type.id})`);
    });

    // Check for news content type specifically
    const [newsType] = await connection.execute('SELECT * FROM content_types WHERE name = ?', ['news']);
    if (newsType.length === 0) {
      console.log('\n❌ No "news" content type found!');
      console.log('This might be why the news page is failing.');
      
      // Check if there's a blog content type
      const [blogType] = await connection.execute('SELECT * FROM content_types WHERE name = ?', ['blog']);
      if (blogType.length > 0) {
        console.log('✅ Found "blog" content type - migration may not have run');
        console.log('Blog type:', blogType[0]);
      }
    } else {
      console.log('\n✅ Found "news" content type:', newsType[0]);
      
      // Check for news content
      const newsTypeId = newsType[0].id;
      const [newsContent] = await connection.execute(
        'SELECT * FROM content WHERE type_id = ? ORDER BY created_at DESC',
        [newsTypeId]
      );
      
      console.log(`\n=== News Content ===`);
      console.log(`Found ${newsContent.length} news items:`);
      newsContent.forEach(item => {
        console.log(`  - ${item.title} (Published: ${item.published}, Slug: ${item.slug})`);
      });
      
      // Check published news content specifically
      const [publishedNews] = await connection.execute(
        'SELECT * FROM content WHERE type_id = ? AND published = TRUE ORDER BY created_at DESC',
        [newsTypeId]
      );
      
      console.log(`\n=== Published News Content ===`);
      console.log(`Found ${publishedNews.length} published news items:`);
      publishedNews.forEach(item => {
        console.log(`  - ${item.title} (Slug: ${item.slug})`);
      });
    }

    // Test the exact API call that the news page makes
    console.log('\n=== Testing API Query ===');
    try {
      const [apiResult] = await connection.execute('SELECT * FROM content_types WHERE name = ?', ['news']);
      if (apiResult.length === 0) {
        console.log('❌ ContentTypeModel.getByName("news") would return null');
        console.log('This explains the "Invalid content type" error');
      } else {
        const newsTypeId = apiResult[0].id;
        console.log(`✅ ContentTypeModel.getByName("news") would return: ${newsTypeId}`);
        
        const [contentResult] = await connection.execute(
          `SELECT c.*, ct.name as type_name,
           CONCAT(p.first_name, ' ', p.last_name) as author_name
           FROM content c
           LEFT JOIN content_types ct ON c.type_id = ct.id
           LEFT JOIN profiles p ON c.author_id = p.id
           WHERE c.published = TRUE AND c.type_id = ?
           ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
          [newsTypeId, 10, 0]
        );
        
        console.log(`✅ ContentModel.getPublishedByType would return ${contentResult.length} items`);
      }
    } catch (apiError) {
      console.error('❌ API query simulation failed:', apiError.message);
    }

    console.log('\n✅ News content test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testNewsContent();
