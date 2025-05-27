-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content ENABLE ROW LEVEL SECURITY;

-- Create user roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator with full access'),
  ('manager', 'Manager with access to most features'),
  ('sales', 'Sales staff with access to customers and orders'),
  ('inventory', 'Inventory staff with access to products and inventory'),
  ('customer', 'Customer with access to their own orders and invoices')
ON CONFLICT (name) DO NOTHING;

-- Create user profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  role_id UUID REFERENCES roles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  parent_id UUID REFERENCES product_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default product categories
INSERT INTO product_categories (name, description, slug) VALUES
  ('Solar Panels', 'Solar panels for residential and commercial use', 'solar-panels'),
  ('Inverters', 'Solar inverters for converting DC to AC power', 'inverters'),
  ('Batteries', 'Energy storage solutions', 'batteries'),
  ('Mounting Systems', 'Mounting hardware for solar installations', 'mounting-systems'),
  ('Accessories', 'Additional components and accessories', 'accessories')
ON CONFLICT (slug) DO NOTHING;

-- Add category_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);

-- Create product tags table
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_tags_junction table
CREATE TABLE IF NOT EXISTS product_tags_junction (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  duration INTEGER, -- in minutes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default services
INSERT INTO services (name, description, price, duration, is_active) VALUES
  ('Solar Panel Installation', 'Professional installation of solar panels', 1500.00, 480, TRUE),
  ('System Maintenance', 'Regular maintenance of solar power systems', 150.00, 120, TRUE),
  ('Energy Consultation', 'Professional consultation on energy efficiency', 100.00, 60, TRUE),
  ('System Upgrade', 'Upgrade existing solar power systems', 800.00, 240, TRUE)
ON CONFLICT DO NOTHING;

-- Create service_appointments table
CREATE TABLE IF NOT EXISTS service_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_assignments table
CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES service_appointments(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_types table
CREATE TABLE IF NOT EXISTS content_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default content types
INSERT INTO content_types (name, description) VALUES
  ('page', 'Website pages'),
  ('blog', 'Blog posts'),
  ('product', 'Product descriptions'),
  ('service', 'Service descriptions'),
  ('faq', 'Frequently asked questions')
ON CONFLICT (name) DO NOTHING;

-- Add type_id to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES content_types(id);

-- Create content_categories table
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_categories_junction table
CREATE TABLE IF NOT EXISTS content_categories_junction (
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  category_id UUID REFERENCES content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, is_active) VALUES
  ('Credit Card', TRUE),
  ('Bank Transfer', TRUE),
  ('Cash', TRUE),
  ('Check', TRUE),
  ('PayPal', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Add payment_method_id to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method_id UUID REFERENCES payment_methods(id),
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Row Level Security Policies
-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Customers policies
CREATE POLICY "Staff can view all customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'sales')
      )
    )
  );

CREATE POLICY "Staff can insert customers"
  ON customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'sales')
      )
    )
  );

CREATE POLICY "Staff can update customers"
  ON customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'sales')
      )
    )
  );

-- Products policies
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can view all products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'inventory')
      )
    )
  );

CREATE POLICY "Staff can insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'inventory')
      )
    )
  );

CREATE POLICY "Staff can update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'inventory')
      )
    )
  );

-- Inventory policies
CREATE POLICY "Staff can view inventory"
  ON inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'inventory')
      )
    )
  );

CREATE POLICY "Staff can insert inventory"
  ON inventory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'inventory')
      )
    )
  );

CREATE POLICY "Staff can update inventory"
  ON inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'inventory')
      )
    )
  );

-- Orders policies
CREATE POLICY "Staff can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'sales')
      )
    )
  );

CREATE POLICY "Customers can view their own orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert orders"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'sales')
      )
    )
  );

CREATE POLICY "Staff can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'sales')
      )
    )
  );

-- Invoices policies
CREATE POLICY "Staff can view all invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'sales')
      )
    )
  );

CREATE POLICY "Customers can view their own invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN customers ON orders.customer_id = customers.id
      WHERE orders.id = invoices.order_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'sales')
      )
    )
  );

CREATE POLICY "Staff can update invoices"
  ON invoices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager', 'sales')
      )
    )
  );

-- Content policies
CREATE POLICY "Anyone can view published content"
  ON content FOR SELECT
  USING (published = true);

CREATE POLICY "Staff can view all content"
  ON content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Staff can insert content"
  ON content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Staff can update content"
  ON content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'manager')
      )
    )
  );

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_customers_modtime
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_products_modtime
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_inventory_modtime
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_warehouses_modtime
BEFORE UPDATE ON warehouses
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_orders_modtime
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_invoices_modtime
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_content_modtime
BEFORE UPDATE ON content
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
