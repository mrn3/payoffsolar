#!/usr/bin/env node

/**
 * Production Data Sync Script
 * 
 * This script safely copies all data from the production database to the local database.
 * It performs the following steps:
 * 1. Test SSH connection to production server
 * 2. Export production database via SSH
 * 3. Clear all data from local database (preserving schema)
 * 4. Import production data to local database
 * 5. Verify data integrity
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const util = require('util');

// Load environment variables
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
  console.log('📄 Loaded environment from .env.local');
} else if (fs.existsSync('.env')) {
  require('dotenv').config({ path: '.env' });
  console.log('📄 Loaded environment from .env');
}

const execAsync = util.promisify(exec);

// Configuration
const PRODUCTION_SSH_HOST = 'payoffsolar';
const PRODUCTION_DB_NAME = 'payoffsolar';
const LOCAL_DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'payoffsolar'
};

const DUMP_FILE = path.join(__dirname, 'production-data-dump.sql');

// List of all tables in the correct order for deletion (respecting foreign key constraints)
const TABLES_TO_CLEAR = [
  'task_comments',
  'project_members', 
  'tasks',
  'projects',
  'listing_images',
  'product_listings',
  'platform_credentials',
  'listing_templates',
  'affiliate_codes',
  'listing_platforms',
  'content_blocks',
  'block_types',
  'content',
  'content_types',
  'services',
  'product_cost_breakdowns',
  'cost_items',
  'invoices',
  'cost_categories',
  'order_items',
  'orders',
  'inventory',
  'warehouses',
  'product_bundle_items',
  'product_images',
  'products',
  'product_categories',
  'contacts',
  'profiles',
  'password_reset_tokens',
  'users',
  'roles',
  'site_settings'
];

async function testSSHConnection() {
  console.log('🔍 Testing SSH connection to production...');
  
  try {
    const { stdout, stderr } = await execAsync(`ssh ${PRODUCTION_SSH_HOST} "echo 'SSH connection successful'"`, {
      timeout: 10000
    });
    
    if (stdout.includes('SSH connection successful')) {
      console.log('✅ SSH connection to production successful');
      return true;
    } else {
      console.error('❌ SSH connection test failed:', stderr);
      return false;
    }
  } catch (error) {
    console.error('❌ SSH connection failed:', error.message);
    return false;
  }
}

async function exportProductionDatabase() {
  console.log('📤 Exporting production database...');
  
  try {
    // First, get the production database credentials
    console.log('🔍 Getting production database configuration...');

    const { stdout: envOutput } = await execAsync(`ssh ${PRODUCTION_SSH_HOST} "cd /opt/bitnami/projects/payoffsolar && cat .env | grep MYSQL"`, {
      timeout: 30000
    });

    console.log('Production DB config found');

    // Export the database with proper options
    const dumpCommand = `ssh ${PRODUCTION_SSH_HOST} "cd /opt/bitnami/projects/payoffsolar && source .env && mysqldump --single-transaction --routines --triggers --add-drop-table --extended-insert --quick --lock-tables=false -h\\$MYSQL_HOST -u\\$MYSQL_USER -p\\$MYSQL_PASSWORD \\$MYSQL_DATABASE"`;
    
    console.log('🔄 Running mysqldump on production...');
    
    const { stdout: dumpOutput } = await execAsync(dumpCommand, {
      timeout: 300000, // 5 minutes timeout
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer
    });
    
    // Write dump to file
    fs.writeFileSync(DUMP_FILE, dumpOutput);
    
    const stats = fs.statSync(DUMP_FILE);
    console.log(`✅ Production database exported successfully (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to export production database:', error.message);
    return false;
  }
}

async function clearLocalDatabase() {
  console.log('🗑️  Clearing local database...');
  
  let connection;
  try {
    connection = await mysql.createConnection(LOCAL_DB_CONFIG);
    console.log('✅ Connected to local database');
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔓 Disabled foreign key checks');
    
    // Clear all tables in the correct order
    for (const table of TABLES_TO_CLEAR) {
      try {
        await connection.execute(`DELETE FROM \`${table}\``);
        console.log(`✅ Cleared table: ${table}`);
      } catch (error) {
        // Table might not exist, which is fine
        console.log(`⚠️  Table ${table} not found or already empty`);
      }
    }
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🔒 Re-enabled foreign key checks');
    
    console.log('✅ Local database cleared successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to clear local database:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function importProductionData() {
  console.log('📥 Importing production data to local database...');
  
  try {
    if (!fs.existsSync(DUMP_FILE)) {
      throw new Error('Production dump file not found');
    }
    
    const importCommand = `mysql -h${LOCAL_DB_CONFIG.host} -P${LOCAL_DB_CONFIG.port} -u${LOCAL_DB_CONFIG.user} ${LOCAL_DB_CONFIG.password ? `-p${LOCAL_DB_CONFIG.password}` : ''} ${LOCAL_DB_CONFIG.database} < "${DUMP_FILE}"`;
    
    console.log('🔄 Running mysql import...');
    
    await execAsync(importCommand, {
      timeout: 300000, // 5 minutes timeout
    });
    
    console.log('✅ Production data imported successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to import production data:', error.message);
    return false;
  }
}

async function verifyDataIntegrity() {
  console.log('🔍 Verifying data integrity...');
  
  let connection;
  try {
    connection = await mysql.createConnection(LOCAL_DB_CONFIG);
    
    // Check some key tables for data
    const checks = [
      { table: 'users', description: 'Users' },
      { table: 'contacts', description: 'Contacts' },
      { table: 'products', description: 'Products' },
      { table: 'orders', description: 'Orders' },
      { table: 'content', description: 'Content' }
    ];
    
    for (const check of checks) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${check.table}\``);
        const count = rows[0].count;
        console.log(`✅ ${check.description}: ${count} records`);
      } catch (error) {
        console.log(`⚠️  Could not verify ${check.description}: ${error.message}`);
      }
    }
    
    console.log('✅ Data integrity verification completed');
    return true;
    
  } catch (error) {
    console.error('❌ Data integrity verification failed:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up temporary files...');
  
  try {
    if (fs.existsSync(DUMP_FILE)) {
      fs.unlinkSync(DUMP_FILE);
      console.log('✅ Temporary dump file removed');
    }
  } catch (error) {
    console.log('⚠️  Could not remove temporary files:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting production data sync...\n');
  
  try {
    // Step 1: Test SSH connection
    const sshOk = await testSSHConnection();
    if (!sshOk) {
      throw new Error('SSH connection failed');
    }
    
    console.log('');
    
    // Step 2: Export production database
    const exportOk = await exportProductionDatabase();
    if (!exportOk) {
      throw new Error('Production database export failed');
    }
    
    console.log('');
    
    // Step 3: Clear local database
    const clearOk = await clearLocalDatabase();
    if (!clearOk) {
      throw new Error('Local database clear failed');
    }
    
    console.log('');
    
    // Step 4: Import production data
    const importOk = await importProductionData();
    if (!importOk) {
      throw new Error('Production data import failed');
    }
    
    console.log('');
    
    // Step 5: Verify data integrity
    await verifyDataIntegrity();
    
    console.log('');
    console.log('🎉 Production data sync completed successfully!');
    console.log('');
    console.log('Your local database now contains all production data.');
    console.log('You can start your development server with: yarn dev');
    
  } catch (error) {
    console.error('\n💥 Data sync failed:', error.message);
    console.error('\nPlease check the error above and try again.');
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted. Cleaning up...');
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Process terminated. Cleaning up...');
  await cleanup();
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  testSSHConnection,
  exportProductionDatabase,
  clearLocalDatabase,
  importProductionData,
  verifyDataIntegrity
};
