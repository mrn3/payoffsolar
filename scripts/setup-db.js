#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up MySQL database for Payoff Solar...\n');

// Check if MySQL is running
try {
  execSync('mysql --version', { stdio: 'ignore' });
  console.log('✅ MySQL is installed');
} catch (error) {
  console.error('❌ MySQL is not installed or not in PATH');
  console.log('Please install MySQL and make sure it\'s running');
  process.exit(1);
}

// Check if we can connect to MySQL
try {
  execSync('mysql -u root -e "SELECT 1"', { stdio: 'ignore' });
  console.log('✅ MySQL connection successful');
} catch (error) {
  console.error('❌ Cannot connect to MySQL');
  console.log('Please make sure MySQL is running and you can connect as root');
  console.log('You may need to set a password: mysql -u root -p');
  process.exit(1);
}

// Run the database initialization
try {
  console.log('📝 Creating database and tables...');
  
  // Import the schema
  const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'mysql', 'schema.sql');
  execSync(`mysql -u root < "${schemaPath}"`, { stdio: 'inherit' });
  
  console.log('✅ Database schema created successfully');
  
  // Run the Node.js initialization script
  console.log('🌱 Seeding database with initial data...');
  execSync('npx tsx src/lib/mysql/init.ts', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  console.log('\n🎉 Database setup complete!');
  console.log('\nNext steps:');
  console.log('1. Copy .env.local.example to .env.local');
  console.log('2. Update the MySQL connection settings in .env.local');
  console.log('3. Run: npm run dev');
  
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}
