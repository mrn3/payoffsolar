-- Migration: Remove "Followed Up" status and migrate to "Complete"
-- This migration updates all orders with "Followed Up" status to "Complete"
-- and removes "Followed Up" from the valid status options

-- Update all orders with "Followed Up" status to "Complete"
UPDATE orders SET status = 'Complete' WHERE status = 'Followed Up';

-- Verify the migration
SELECT 
    COUNT(*) as total_orders,
    SUM(CASE WHEN status = 'Followed Up' THEN 1 ELSE 0 END) as followed_up_count,
    SUM(CASE WHEN status = 'Complete' THEN 1 ELSE 0 END) as complete_count
FROM orders;
