#!/usr/bin/env node

/**
 * Script to generate slugs for existing products
 * Run this after adding the slug column to the products table
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Slug generation function (matches the TypeScript version)
function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading and trailing hyphens
    .trim();
}

function generateProductSlug(name, sku) {
  if (!name && !sku) return '';
  
  const nameSlug = generateSlug(name);
  const skuSlug = generateSlug(sku);
  
  // Combine name and SKU for uniqueness
  if (nameSlug && skuSlug) {
    return `${nameSlug}-${skuSlug}`;
  } else if (nameSlug) {
    return nameSlug;
  } else {
    return skuSlug;
  }
}

async function main() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar',
      port: process.env.MYSQL_PORT || 3306
    });

    console.log('Connected to database');

    // First, check if slug column exists and add it if it doesn't
    try {
      await connection.execute('SELECT slug FROM products LIMIT 1');
      console.log('Slug column already exists');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Adding slug column to products table...');
        await connection.execute('ALTER TABLE products ADD COLUMN slug VARCHAR(255) UNIQUE AFTER sku');
        await connection.execute('CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)');
        console.log('Slug column added successfully');
      } else {
        throw error;
      }
    }

    // Get all products without slugs
    const [products] = await connection.execute(
      'SELECT id, name, sku, slug FROM products WHERE slug IS NULL OR slug = ""'
    );

    console.log(`Found ${products.length} products without slugs`);

    if (products.length === 0) {
      console.log('All products already have slugs');
      return;
    }

    // Generate slugs for each product
    const slugMap = new Map();
    const updates = [];

    for (const product of products) {
      let baseSlug = generateProductSlug(product.name, product.sku);
      let finalSlug = baseSlug;
      let counter = 1;

      // Handle duplicates by appending a number
      while (slugMap.has(finalSlug)) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      slugMap.set(finalSlug, product.id);
      updates.push({
        id: product.id,
        slug: finalSlug,
        name: product.name,
        sku: product.sku
      });
    }

    // Update products with generated slugs
    console.log('Updating products with generated slugs...');
    
    for (const update of updates) {
      await connection.execute(
        'UPDATE products SET slug = ? WHERE id = ?',
        [update.slug, update.id]
      );
      
      console.log(`Updated product "${update.name}" (${update.sku}) with slug: ${update.slug}`);
    }

    console.log(`Successfully updated ${updates.length} products with slugs`);

  } catch (error) {
    console.error('Error generating product slugs:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSlug, generateProductSlug };
