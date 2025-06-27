-- Migration: Add affiliate codes table
-- Date: 2025-06-27
-- Description: Add support for affiliate discount codes

-- Create affiliate codes table
CREATE TABLE IF NOT EXISTS affiliate_codes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NULL,
  usage_limit INT NULL,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert some sample affiliate codes
INSERT INTO affiliate_codes (code, name, discount_type, discount_value, is_active) VALUES
('SAVE10', '10% Off Everything', 'percentage', 10.00, TRUE),
('WELCOME20', 'Welcome 20% Discount', 'percentage', 20.00, TRUE),
('FLAT50', '$50 Off Purchase', 'fixed_amount', 50.00, TRUE),
('PARTNER15', 'Partner 15% Discount', 'percentage', 15.00, TRUE);
