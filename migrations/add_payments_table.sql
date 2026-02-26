-- Migration: Add payments table
-- Date: 2026-02-26
-- Description: Add payment tracking functionality to orders

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Verify table creation
SELECT 'Payments table created successfully' AS status;

