-- Migration: Add data_sheet_url column to products table
-- Date: 2025-06-21
-- Description: Add support for PDF data sheet uploads to products

-- Add data_sheet_url column to products table
ALTER TABLE products ADD COLUMN data_sheet_url VARCHAR(500) AFTER image_url;
