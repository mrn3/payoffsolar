-- Migration: Make cost item description optional
-- This migration makes the description field nullable in the cost_items table

USE payoffsolar;

-- Modify the description column to allow NULL values
ALTER TABLE cost_items MODIFY COLUMN description VARCHAR(255);
