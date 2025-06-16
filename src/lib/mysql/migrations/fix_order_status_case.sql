-- Migration: Fix order status case to use title case
-- This migration updates the default status value and existing records to use title case

-- Update existing records to use title case
UPDATE orders SET status = 'Proposed' WHERE status = 'proposed';
UPDATE orders SET status = 'Cancelled' WHERE status = 'cancelled';
UPDATE orders SET status = 'Complete' WHERE status = 'complete';
UPDATE orders SET status = 'Followed Up' WHERE status = 'followed up';
UPDATE orders SET status = 'Paid' WHERE status = 'paid';
UPDATE orders SET status = 'Scheduled' WHERE status = 'scheduled';

-- Update the default value for the status column
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'Proposed';
