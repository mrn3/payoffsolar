-- Fix for the unique constraint issue on product_cost_breakdowns table
-- This script removes the problematic unique constraint that prevents
-- multiple cost breakdown items per product-category combination

-- Check if the constraint exists and remove it
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_cost_breakdowns' 
      AND CONSTRAINT_TYPE = 'UNIQUE'
      AND CONSTRAINT_NAME = 'unique_product_category'
);

-- Remove the constraint if it exists
SET @sql = IF(@constraint_exists > 0, 
    'ALTER TABLE product_cost_breakdowns DROP INDEX unique_product_category',
    'SELECT "Constraint does not exist or has already been removed" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the constraint has been removed
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: Unique constraint has been removed'
        ELSE 'WARNING: Unique constraint still exists'
    END as status
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'product_cost_breakdowns' 
  AND CONSTRAINT_TYPE = 'UNIQUE'
  AND CONSTRAINT_NAME = 'unique_product_category';
