-- Migration: Add slug column to products table
-- Date: 2025-06-27
-- Description: Add SEO-friendly slug field to products for URL generation

-- Add slug column to products table
ALTER TABLE products ADD COLUMN slug VARCHAR(255) UNIQUE AFTER sku;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Update existing products with generated slugs based on name and SKU
-- This will be done in a separate data migration script
