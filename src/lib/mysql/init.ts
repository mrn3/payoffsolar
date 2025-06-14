import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import {testConnection} from './connection';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

export async function initializeDatabase() {
  console.log('🔄 Initializing MySQL database...');
  console.log('🔧 Database config:', {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD ? '***' : 'NOT SET',
    database: process.env.MYSQL_DATABASE
  });
  
  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to MySQL database');
  }
  
  try {
    // Read and execute schema
    const schemaPath = path.join(process.cwd(), 'src/lib/mysql/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await executeQuery(statement);
      }
    }
    
    console.log('✅ Database initialized successfully');
    return true;
  } catch (_error) {
    console.error('❌ Database initialization failed:', _error);
    throw error;
  }
}

// Function to seed initial data
export async function seedDatabase() {
  console.log('🌱 Seeding database with initial data...');
  
  try {
    // Insert sample warehouses
    await executeQuery(`
      INSERT IGNORE INTO warehouses (_id, name, address, city, state, zip) VALUES
      (UUID(), 'Main Warehouse', '123 Industrial Blvd', 'Phoenix', 'AZ', '85001'),
      (UUID(), 'East Coast Warehouse', '456 Commerce St', 'Atlanta', 'GA', '30301'),
      (UUID(), 'West Coast Warehouse', '789 Pacific Ave', 'Los Angeles', 'CA', '90001')
    `);
    
    // Insert sample product categories
    await executeQuery(`
      INSERT IGNORE INTO product_categories (_id, name, description, slug) VALUES
      (UUID(), 'Solar Panels', 'High-efficiency solar panels', 'solar-panels'),
      (UUID(), 'Inverters', 'Power inverters and converters', 'inverters'),
      (UUID(), 'Batteries', 'Energy storage solutions', 'batteries'),
      (UUID(), 'Mounting Systems', 'Panel mounting hardware', 'mounting-systems')
    `);
    
    // Get category IDs for products
    const categories = await executeQuery(`SELECT id, slug FROM product_categories`);
    const categoryMap = categories.reduce((acc: unknown, cat: unknown) => {
      acc[cat.slug] = cat.id;
      return acc;
    }, {});
    
    // Insert sample products
    await executeQuery(`
      INSERT IGNORE INTO products (_id, name, description, price, sku, category_id, is_active) VALUES
      (UUID(), 'SolarMax 400W Panel', 'High-efficiency 400W monocrystalline solar panel', 299.99, 'SM-400W', ?, TRUE),
      (UUID(), 'PowerInvert 5000W', '5000W pure sine wave inverter', 899.99, 'PI-5000W', ?, TRUE),
      (UUID(), 'EnergyStore 10kWh', '10kWh lithium battery storage system', 4999.99, 'ES-10KWH', ?, TRUE),
      (UUID(), 'RoofMount Pro', 'Professional roof mounting system', 149.99, 'RM-PRO', ?, TRUE)
    `, [
      categoryMap['solar-panels'],
      categoryMap['inverters'], 
      categoryMap['batteries'],
      categoryMap['mounting-systems']
    ]);
    
    console.log('✅ Database seeded successfully');
    return true;
  } catch (_error) {
    console.error('❌ Database seeding failed:', _error);
    throw error;
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => seedDatabase())
    .then(() => {
      console.log('🎉 Database setup complete!');
      process.exit(0);
    })
    .catch((_error) => {
      console.error('💥 Database setup failed:', _error);
      process.exit(1);
    });
}
