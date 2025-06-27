-- Migration: Add tax_percentage column to products table
-- Date: 2025-06-27
-- Description: Add support for individual product tax percentages

-- Add tax_percentage column to products table
ALTER TABLE products ADD COLUMN tax_percentage DECIMAL(5, 2) DEFAULT 0.00 AFTER sku;
