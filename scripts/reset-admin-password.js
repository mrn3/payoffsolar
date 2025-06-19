#!/usr/bin/env node

/**
 * Script to reset the password for matt@payoffsolar.com
 * Run with: node scripts/reset-admin-password.js
 */

// Load environment variables first
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

async function resetAdminPassword() {
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
    const newPassword = 'admin123';

    // Check if user exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length === 0) {
      console.log('❌ User with email matt@payoffsolar.com not found');
      return;
    }

    const userId = existingUsers[0].id;
    console.log('👤 User found with ID:', userId);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    console.log('🔐 New password hashed');

    // Update password
    await connection.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
    console.log('🔄 Password updated in database');

    console.log('✅ Admin password reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);
    console.log('⚠️  Please change the password after login');

  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📊 Database connection closed');
    }
  }
}

// Run the script
resetAdminPassword();
