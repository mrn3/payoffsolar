-- Migration: Remove description columns from cost breakdown tables
-- This migration removes the description field from both cost_items and product_cost_breakdowns tables

USE payoffsolar;

-- Remove description column from cost_items table
ALTER TABLE cost_items DROP COLUMN IF EXISTS description;

-- Remove description column from product_cost_breakdowns table
ALTER TABLE product_cost_breakdowns DROP COLUMN IF EXISTS description;
