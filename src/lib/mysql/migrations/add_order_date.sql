-- Migration: Add order_date column to orders table
-- This migration adds the order_date field to the orders table

-- Add the order_date column
ALTER TABLE orders ADD COLUMN order_date DATE;

-- Update existing orders to use created_at date as order_date
UPDATE orders SET order_date = DATE(created_at) WHERE order_date IS NULL;

-- Make order_date NOT NULL after populating existing records
ALTER TABLE orders MODIFY COLUMN order_date DATE NOT NULL;
