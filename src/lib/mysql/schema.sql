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
  data_sheet_url VARCHAR(500),
  category_id VARCHAR(36),
  sku VARCHAR(100) UNIQUE NOT NULL,
  tax_percentage DECIMAL(5, 2) DEFAULT 0.00,
  shipping_methods JSON,
  is_bundle BOOLEAN DEFAULT FALSE,
  bundle_pricing_type ENUM('calculated', 'fixed') DEFAULT 'calculated',
  bundle_discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
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

-- Create product bundle items table for bundle composition
CREATE TABLE IF NOT EXISTS product_bundle_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bundle_product_id VARCHAR(36) NOT NULL,
  component_product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bundle_product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (component_product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_bundle_component (bundle_product_id, component_product_id)
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

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create cost items table
CREATE TABLE IF NOT EXISTS cost_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES cost_categories(id)
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
  content_mode ENUM('rich_text', 'blocks') DEFAULT 'rich_text',
  type_id VARCHAR(36),
  published BOOLEAN DEFAULT FALSE,
  author_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES content_types(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Create block types table
CREATE TABLE IF NOT EXISTS block_types (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  schema_config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create content blocks table
CREATE TABLE IF NOT EXISTS content_blocks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  content_id VARCHAR(36) NOT NULL,
  block_type_id VARCHAR(36) NOT NULL,
  block_order INT NOT NULL DEFAULT 0,
  configuration JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  FOREIGN KEY (block_type_id) REFERENCES block_types(id),
  INDEX idx_content_blocks_content_order (content_id, block_order)
);

-- Insert default block types
INSERT IGNORE INTO block_types (id, name, display_name, description, icon, schema_config) VALUES
  (UUID(), 'hero', 'Hero Section', 'Large banner with title, subtitle, and optional background image', 'FaImage', JSON_OBJECT(
    'properties', JSON_OBJECT(
      'title', JSON_OBJECT('type', 'string', 'required', true),
      'subtitle', JSON_OBJECT('type', 'string', 'required', false),
      'backgroundImage', JSON_OBJECT('type', 'string', 'required', false),
      'textAlign', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('left', 'center', 'right'), 'default', 'center')
    )
  )),
  (UUID(), 'card_grid', 'Card Grid', 'Grid of cards with images, titles, and descriptions', 'FaThLarge', JSON_OBJECT(
    'properties', JSON_OBJECT(
      'title', JSON_OBJECT('type', 'string', 'required', false),
      'subtitle', JSON_OBJECT('type', 'string', 'required', false),
      'columns', JSON_OBJECT('type', 'number', 'min', 1, 'max', 4, 'default', 3),
      'cards', JSON_OBJECT(
        'type', 'array',
        'items', JSON_OBJECT(
          'type', 'object',
          'properties', JSON_OBJECT(
            'image', JSON_OBJECT('type', 'string', 'required', false),
            'title', JSON_OBJECT('type', 'string', 'required', true),
            'description', JSON_OBJECT('type', 'string', 'required', false),
            'link', JSON_OBJECT('type', 'string', 'required', false),
            'linkText', JSON_OBJECT('type', 'string', 'required', false)
          )
        )
      )
    )
  )),
  (UUID(), 'text_block', 'Text Block', 'Rich text content block', 'FaAlignLeft', JSON_OBJECT(
    'properties', JSON_OBJECT(
      'content', JSON_OBJECT('type', 'string', 'format', 'html', 'required', true),
      'textAlign', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('left', 'center', 'right'), 'default', 'left')
    )
  )),
  (UUID(), 'image_block', 'Image Block', 'Single image with optional caption', 'FaImage', JSON_OBJECT(
    'properties', JSON_OBJECT(
      'image', JSON_OBJECT('type', 'string', 'required', true),
      'caption', JSON_OBJECT('type', 'string', 'required', false),
      'alt', JSON_OBJECT('type', 'string', 'required', false),
      'size', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('small', 'medium', 'large', 'full'), 'default', 'medium')
    )
  )),
  (UUID(), 'video_block', 'Video Block', 'Embedded video content', 'FaVideo', JSON_OBJECT(
    'properties', JSON_OBJECT(
      'url', JSON_OBJECT('type', 'string', 'required', true),
      'title', JSON_OBJECT('type', 'string', 'required', false),
      'description', JSON_OBJECT('type', 'string', 'required', false),
      'autoplay', JSON_OBJECT('type', 'boolean', 'default', false)
    )
  ));

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  start_date DATE,
  due_date DATE,
  completion_date DATE,
  budget DECIMAL(10, 2),
  owner_id VARCHAR(36),
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  project_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in_progress', 'review', 'completed', 'cancelled') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  assigned_to VARCHAR(36),
  created_by VARCHAR(36) NOT NULL,
  start_date DATE,
  due_date DATE,
  completion_date DATE,
  estimated_hours DECIMAL(5, 2),
  actual_hours DECIMAL(5, 2),
  parent_task_id VARCHAR(36),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create project_members table for project team assignments
CREATE TABLE IF NOT EXISTS project_members (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('owner', 'manager', 'member', 'viewer') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_user (project_id, user_id)
);

-- Create task_comments table for task discussions
CREATE TABLE IF NOT EXISTS task_comments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  task_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_bundle ON product_bundle_items(bundle_product_id);
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_component ON product_bundle_items(component_product_id);
CREATE INDEX IF NOT EXISTS idx_products_is_bundle ON products(is_bundle);

CREATE INDEX IF NOT EXISTS idx_content_type ON content(type_id);
CREATE INDEX IF NOT EXISTS idx_content_author ON content(author_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_content_published ON content(published);

-- Create listing platforms table
CREATE TABLE IF NOT EXISTS listing_platforms (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  api_endpoint VARCHAR(500),
  requires_auth BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  configuration JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create listing templates table
CREATE TABLE IF NOT EXISTS listing_templates (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  platform_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  title_template TEXT,
  description_template TEXT,
  category_mapping JSON,
  price_adjustment_type ENUM('none', 'percentage', 'fixed') DEFAULT 'none',
  price_adjustment_value DECIMAL(10, 2) DEFAULT 0,
  shipping_template JSON,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (platform_id) REFERENCES listing_platforms(id) ON DELETE CASCADE
);

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

-- Create product listings table
CREATE TABLE IF NOT EXISTS product_listings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id VARCHAR(36) NOT NULL,
  platform_id VARCHAR(36) NOT NULL,
  template_id VARCHAR(36),
  external_listing_id VARCHAR(255),
  title VARCHAR(500),
  description TEXT,
  price DECIMAL(10, 2),
  status ENUM('draft', 'pending', 'active', 'paused', 'ended', 'error') DEFAULT 'draft',
  listing_url VARCHAR(1000),
  error_message TEXT,
  last_sync_at TIMESTAMP NULL,
  auto_sync BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (platform_id) REFERENCES listing_platforms(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES listing_templates(id) ON DELETE SET NULL,
  UNIQUE KEY unique_product_platform (product_id, platform_id)
);

-- Create listing images table
CREATE TABLE IF NOT EXISTS listing_images (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  listing_id VARCHAR(36) NOT NULL,
  product_image_id VARCHAR(36),
  external_image_id VARCHAR(255),
  image_url VARCHAR(1000) NOT NULL,
  sort_order INT DEFAULT 0,
  upload_status ENUM('pending', 'uploaded', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES product_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (product_image_id) REFERENCES product_images(id) ON DELETE SET NULL
);

-- Create platform credentials table
CREATE TABLE IF NOT EXISTS platform_credentials (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  platform_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  credential_type ENUM('api_key', 'oauth', 'username_password') NOT NULL,
  credentials JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (platform_id) REFERENCES listing_platforms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_platform (user_id, platform_id)
);

-- Insert sample roles
INSERT IGNORE INTO roles (id, name, description) VALUES
('admin-role-id', 'admin', 'Administrator with full access'),
('contact-role-id', 'contact', 'Contact with limited access');

-- Create site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default listing platforms
INSERT IGNORE INTO listing_platforms (id, name, display_name, api_endpoint, requires_auth, is_active, configuration) VALUES
('ebay-platform-id', 'ebay', 'eBay', 'https://api.ebay.com/ws/api.dll', TRUE, TRUE, '{"sandbox_endpoint": "https://api.sandbox.ebay.com/ws/api.dll", "max_images": 12, "max_title_length": 80, "max_description_length": 500000}'),
('facebook-platform-id', 'facebook_marketplace', 'Facebook Marketplace', 'https://graph.facebook.com', TRUE, TRUE, '{"max_images": 20, "max_title_length": 100, "max_description_length": 9999}'),
('amazon-platform-id', 'amazon', 'Amazon', 'https://mws.amazonservices.com', TRUE, TRUE, '{"max_images": 9, "max_title_length": 200, "max_description_length": 2000}'),
('ksl-platform-id', 'ksl', 'KSL Classifieds', 'https://api.ksl.com', TRUE, TRUE, '{"max_images": 8, "max_title_length": 50, "max_description_length": 4000}'),
('offerup-platform-id', 'offerup', 'OfferUp', 'https://api.offerup.com', TRUE, TRUE, '{"max_images": 12, "max_title_length": 80, "max_description_length": 1000}'),
('nextdoor-platform-id', 'nextdoor', 'Nextdoor', 'https://api.nextdoor.com', TRUE, TRUE, '{"max_images": 10, "max_title_length": 75, "max_description_length": 1200}'),
('craigslist-platform-id', 'craigslist', 'Craigslist', NULL, FALSE, TRUE, '{"max_images": 8, "max_title_length": 70, "max_description_length": 4000, "requires_manual_posting": true}');

-- Insert default site settings
INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('google_analytics_id', '', 'string', 'Google Analytics Measurement ID (e.g., G-XXXXXXXXXX)', TRUE),
('site_name', 'Payoff Solar', 'string', 'Site name displayed in browser title and headers', TRUE),
('contact_phone', '(801) 448-6396', 'string', 'Primary contact phone number', TRUE),
('contact_email', 'info@payoffsolar.com', 'string', 'Primary contact email address', TRUE);

-- Insert default listing templates
INSERT IGNORE INTO listing_templates (id, platform_id, name, title_template, description_template, category_mapping, price_adjustment_type, price_adjustment_value, is_default, is_active) VALUES
('ebay-default-template', 'ebay-platform-id', 'eBay Default Template',
 '{{product_name}} - {{product_sku}} - Solar Equipment',
 '<h2>{{product_name}}</h2><p><strong>SKU:</strong> {{product_sku}}</p><p><strong>Price:</strong> ${{product_price}}</p><div>{{product_description}}</div><p><strong>Condition:</strong> New</p><p><strong>Shipping:</strong> Fast and secure shipping available</p><p><strong>Returns:</strong> 30-day return policy</p>',
 '{"solar-panels": "11700", "inverters": "41979", "batteries": "20676", "mounting-systems": "11700", "accessories": "11700"}',
 'percentage', 5.00, TRUE, TRUE),
('facebook-default-template', 'facebook-platform-id', 'Facebook Marketplace Default Template',
 '{{product_name}} - {{product_sku}}',
 '{{product_name}}\n\nSKU: {{product_sku}}\nPrice: ${{product_price}}\n\n{{product_description}}\n\nCondition: New\nPickup or delivery available\nMessage for more details!',
 '{"solar-panels": "home_garden", "inverters": "electronics", "batteries": "electronics", "mounting-systems": "home_garden", "accessories": "electronics"}',
 'none', 0.00, TRUE, TRUE),
('amazon-default-template', 'amazon-platform-id', 'Amazon Default Template',
 '{{product_name}} {{product_sku}} Solar Equipment',
 '{{product_description}}\n\nKey Features:\n- High quality solar equipment\n- Professional grade\n- Fast shipping\n- Excellent customer service',
 '{"solar-panels": "2236", "inverters": "228013", "batteries": "228013", "mounting-systems": "2236", "accessories": "2236"}',
 'percentage', 10.00, TRUE, TRUE),
('ksl-default-template', 'ksl-platform-id', 'KSL Default Template',
 '{{product_name}} - {{product_sku}}',
 '{{product_name}}\n\nSKU: {{product_sku}}\nPrice: ${{product_price}}\n\n{{product_description}}\n\nCondition: New\nLocal pickup or delivery available in Utah area\nCall or text for more information!',
 '{"solar-panels": "electronics", "inverters": "electronics", "batteries": "electronics", "mounting-systems": "home_garden", "accessories": "electronics"}',
 'none', 0.00, TRUE, TRUE),
('offerup-default-template', 'offerup-platform-id', 'OfferUp Default Template',
 '{{product_name}} - {{product_sku}}',
 '{{product_name}}\n\nSKU: {{product_sku}}\nPrice: ${{product_price}}\n\n{{product_description}}\n\nCondition: New\nPickup available\nShipping possible for additional cost',
 '{"solar-panels": "electronics", "inverters": "electronics", "batteries": "electronics", "mounting-systems": "home_garden", "accessories": "electronics"}',
 'none', 0.00, TRUE, TRUE),
('nextdoor-default-template', 'nextdoor-platform-id', 'Nextdoor Default Template',
 '{{product_name}} - {{product_sku}}',
 '{{product_name}}\n\nSKU: {{product_sku}}\nPrice: ${{product_price}}\n\n{{product_description}}\n\nCondition: New\nLocal pickup preferred\nGreat for neighbors looking for solar equipment!',
 '{"solar-panels": "for_sale", "inverters": "for_sale", "batteries": "for_sale", "mounting-systems": "for_sale", "accessories": "for_sale"}',
 'none', 0.00, TRUE, TRUE),
('craigslist-default-template', 'craigslist-platform-id', 'Craigslist Default Template',
 '{{product_name}} - {{product_sku}} - ${{product_price}}',
 '{{product_name}}\n\nSKU: {{product_sku}}\nPrice: ${{product_price}}\n\n{{product_description}}\n\nCondition: New\nCash only\nPickup preferred\nSerious inquiries only',
 '{"solar-panels": "for_sale", "inverters": "electronics", "batteries": "electronics", "mounting-systems": "for_sale", "accessories": "electronics"}',
 'none', 0.00, TRUE, TRUE);

-- Insert sample warehouses
INSERT IGNORE INTO warehouses (id, name, address, city, state, zip) VALUES
('main-warehouse-id', 'Main Warehouse', '123 Industrial Blvd', 'Phoenix', 'AZ', '85001'),
('east-warehouse-id', 'East Coast Warehouse', '456 Commerce St', 'Atlanta', 'GA', '30301'),
('west-warehouse-id', 'West Coast Warehouse', '789 Pacific Ave', 'Los Angeles', 'CA', '90001');
