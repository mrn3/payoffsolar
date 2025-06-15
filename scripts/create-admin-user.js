#!/usr/bin/env node

/**
 * Script to create the admin user matt@payoffsolar.com
 * Run with: node scripts/create-admin-user.js
 */

// Load environment variables first
// Try .env.local first (for local development), then .env (for server deployment)
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
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'payoffsolar',
      port: process.env.MYSQL_PORT || 3306
    });

    console.log('📊 Connected to MySQL database');

    // Admin user details
    const email = 'matt@payoffsolar.com';
    const password = 'admin123'; // You should change this password after first login
    const firstName = 'Matt';
    const lastName = 'Newman';

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('❌ User with email matt@payoffsolar.com already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    console.log('🔐 Password hashed');

    // Get admin role ID
    const [adminRoles] = await connection.execute(
      'SELECT id FROM roles WHERE name = ?',
      ['admin']
    );

    if (adminRoles.length === 0) {
      console.log('❌ Admin role not found. Please run the database schema first.');
      return;
    }

    const adminRoleId = adminRoles[0].id;
    console.log('👑 Admin role found:', adminRoleId);

    // Generate UUID for user
    const [uuidResult] = await connection.execute('SELECT UUID() as id');
    const userId = uuidResult[0].id;

    // Create user
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, email_verified) VALUES (?, ?, ?, TRUE)',
      [userId, email, passwordHash]
    );
    console.log('👤 User created with ID:', userId);

    // Create profile
    await connection.execute(
      'INSERT INTO profiles (id, first_name, last_name, email, role_id) VALUES (?, ?, ?, ?, ?)',
      [userId, firstName, lastName, email, adminRoleId]
    );
    console.log('📝 Profile created');

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📊 Database connection closed');
    }
  }
}

// Run the script
createAdminUser();
