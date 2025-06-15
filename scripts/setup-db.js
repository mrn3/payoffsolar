// Load environment variables first, before anything else
require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function setupDatabase() {
  let connection;

  try {
    console.log('🔧 Setting up MySQL database...');
    console.log('🔍 Environment variables loaded:');
    console.log('  MYSQL_HOST:', process.env.MYSQL_HOST || 'localhost');
    console.log('  MYSQL_PORT:', process.env.MYSQL_PORT || 3306);
    console.log('  MYSQL_USER:', process.env.MYSQL_USER || 'root');
    console.log('  MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '***' : 'NOT SET');
    console.log('  MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'payoffsolar');
    
    // First, connect without specifying a database to create it
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.MYSQL_DATABASE || 'payoffsolar';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Switch to the database
    await connection.execute(`USE \`${dbName}\``);
    console.log(`✅ Using database '${dbName}'`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'mysql', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await connection.execute(statement);
      } catch (error) {
        // Ignore "table already exists" errors
        if (!error.message.includes('already exists')) {
          console.warn(`Warning executing statement: ${error.message}`);
        }
      }
    }

    console.log('✅ Database schema created successfully');
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
