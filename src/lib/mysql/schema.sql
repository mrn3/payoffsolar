-- Create database
CREATE DATABASE IF NOT EXISTS payoffsolar;
USE payoffsolar;

-- Create user roles table
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT IGNORE INTO roles (id, name, description) VALUES
  (UUID(), 'admin', 'Administrator with full access'),
  (UUID(), 'manager', 'Manager with access to most features'),
  (UUID(), 'sales', 'Sales staff with access to contacts and orders'),
  (UUID(), 'inventory', 'Inventory staff with access to products and inventory'),
  (UUID(), 'contact', 'Contact with access to their own orders');

-- Create users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  role_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(10) NOT NULL,
  notes TEXT,
  user_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE,
  parent_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES product_categories(id)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  category_id VARCHAR(36),
  sku VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- Create product images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id VARCHAR(36) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id VARCHAR(36) NOT NULL,
  warehouse_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  min_quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_warehouse (product_id, warehouse_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  contact_id VARCHAR(36) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'proposed',
  total DECIMAL(10, 2) NOT NULL,
  order_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create cost categories table
CREATE TABLE IF NOT EXISTS cost_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create cost items table
CREATE TABLE IF NOT EXISTS cost_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  description VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES cost_categories(id)
);

-- Create product cost breakdowns table
CREATE TABLE IF NOT EXISTS product_cost_breakdowns (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  calculation_type ENUM('percentage', 'fixed_amount') NOT NULL DEFAULT 'percentage',
  value DECIMAL(10, 4) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES cost_categories(id),
  UNIQUE KEY unique_product_category (product_id, category_id)
);



-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  duration INT, -- in minutes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default services
INSERT IGNORE INTO services (id, name, description, price, duration, is_active) VALUES
  (UUID(), 'Solar Panel Installation', 'Professional installation of solar panels', 1500.00, 480, TRUE),
  (UUID(), 'System Maintenance', 'Regular maintenance of solar power systems', 150.00, 120, TRUE),
  (UUID(), 'Energy Consultation', 'Professional consultation on energy efficiency', 100.00, 60, TRUE),
  (UUID(), 'System Upgrade', 'Upgrade existing solar power systems', 800.00, 240, TRUE);

-- Insert default cost categories
INSERT IGNORE INTO cost_categories (id, name, description, is_active) VALUES
  (UUID(), 'Labor', 'Labor costs for installation and services', TRUE),
  (UUID(), 'Materials', 'Material costs for equipment and supplies', TRUE),
  (UUID(), 'Permits', 'Permit and licensing fees', TRUE),
  (UUID(), 'Transportation', 'Transportation and delivery costs', TRUE),
  (UUID(), 'Equipment Rental', 'Equipment rental and tool costs', TRUE),
  (UUID(), 'Subcontractor', 'Subcontractor and third-party services', TRUE),
  (UUID(), 'Overhead', 'General overhead and administrative costs', TRUE),
  (UUID(), 'Other', 'Miscellaneous costs', TRUE);

-- Create content types table
CREATE TABLE IF NOT EXISTS content_types (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default content types
INSERT IGNORE INTO content_types (id, name, description) VALUES
  (UUID(), 'page', 'Website pages'),
  (UUID(), 'blog', 'Blog posts'),
  (UUID(), 'product', 'Product descriptions'),
  (UUID(), 'service', 'Service descriptions'),
  (UUID(), 'faq', 'Frequently asked questions');

-- Create content table
CREATE TABLE IF NOT EXISTS content (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  type_id VARCHAR(36),
  published BOOLEAN DEFAULT FALSE,
  author_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES content_types(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_orders_contact ON orders(contact_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_order ON cost_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_category ON cost_items(category_id);
CREATE INDEX IF NOT EXISTS idx_cost_categories_active ON cost_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_cost_breakdowns_product ON product_cost_breakdowns(product_id);
CREATE INDEX IF NOT EXISTS idx_product_cost_breakdowns_category ON product_cost_breakdowns(category_id);

CREATE INDEX IF NOT EXISTS idx_content_type ON content(type_id);
CREATE INDEX IF NOT EXISTS idx_content_author ON content(author_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_content_published ON content(published);

-- Insert sample roles
INSERT IGNORE INTO roles (id, name, description) VALUES
('admin-role-id', 'admin', 'Administrator with full access'),
('contact-role-id', 'contact', 'Contact with limited access');

-- Insert sample warehouses
INSERT IGNORE INTO warehouses (id, name, address, city, state, zip) VALUES
('main-warehouse-id', 'Main Warehouse', '123 Industrial Blvd', 'Phoenix', 'AZ', '85001'),
('east-warehouse-id', 'East Coast Warehouse', '456 Commerce St', 'Atlanta', 'GA', '30301'),
('west-warehouse-id', 'West Coast Warehouse', '789 Pacific Ave', 'Los Angeles', 'CA', '90001');
