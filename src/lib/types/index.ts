// Type definitions without database models to avoid importing mysql2 in client components

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  description?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  type: 'free' | 'fixed' | 'calculated' | 'pickup';
  amount?: number;
  warehouses?: string[];
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  data_sheet_url?: string;
  category_id?: string;
  sku: string;
  slug?: string;
  tax_percentage: number;
  shipping_methods?: ShippingMethod[];
  is_bundle: boolean;
  bundle_pricing_type: 'calculated' | 'fixed';
  bundle_discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category_name?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  created_at: string;
}

export interface ProductWithImages extends ProductWithCategory {
  images?: ProductImage[];
}

export interface ProductWithFirstImage extends ProductWithCategory {
  first_image_url?: string;
}

export interface ProductBundleItem {
  id: string;
  bundle_product_id: string;
  component_product_id: string;
  quantity: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductBundleItemWithProduct extends ProductBundleItem {
  component_product_name?: string;
  component_product_sku?: string;
  component_product_price?: number;
  component_product_image_url?: string;
  component_product_description?: string;
}

export interface ProductWithBundleItems extends ProductWithImages {
  bundle_items?: ProductBundleItemWithProduct[];
  calculated_price?: number;
  total_component_price?: number;
}

export interface Order {
  id: string;
  contact_id: string;
  status: 'proposed' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'paid';
  total: number;
  order_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number | string;
  created_at: string;
}

export interface OrderItemWithProduct extends OrderItem {
  product_name?: string;
  product_sku?: string;
}

export interface OrderWithContact extends Order {
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_city?: string;
  contact_state?: string;
  contact_address?: string;
  units_sold?: number;
}

export interface OrderWithItems extends OrderWithContact {
  items?: OrderItemWithProduct[];
  costItems?: CostItemWithCategory[];
}

// Cart item interface for frontend cart management
export interface CartItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_price: number;
  product_image_url?: string;
  quantity: number;
  affiliate_code?: string;
  affiliate_discount?: number;
}

// Affiliate Code model
export interface AffiliateCode {
  id: string;
  code: string;
  name?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CostItem {
  id: string;
  order_id: string;
  category_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface CostItemWithCategory extends CostItem {
  category_name?: string;
}

export interface ProductCostBreakdown {
  id: string;
  product_id: string;
  category_id: string;
  calculation_type: 'percentage' | 'fixed_amount';
  value: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCostBreakdownWithCategory extends ProductCostBreakdown {
  category_name?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  min_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryWithDetails extends Inventory {
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  type_id: string;
  title: string;
  content: string;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface ContentWithDetails extends Content {
  type_name?: string;
  author_name?: string;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingPlatform {
  id: string;
  name: string;
  display_name: string;
  base_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingTemplate {
  id: string;
  platform_id: string;
  name: string;
  title_template?: string;
  description_template?: string;
  category_mapping: Record<string, string>;
  price_adjustment_type: 'none' | 'percentage' | 'fixed';
  price_adjustment_value: number;
  shipping_template?: Record<string, any>;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingTemplateWithPlatform extends ListingTemplate {
  platform_name?: string;
  platform_display_name?: string;
}

export interface ProductListing {
  id: string;
  product_id: string;
  platform_id: string;
  template_id?: string;
  external_listing_id?: string;
  title?: string;
  description?: string;
  price?: number;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'ended' | 'error';
  listing_url?: string;
  error_message?: string;
  last_sync_at?: string;
  auto_sync: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListingWithDetails extends ProductListing {
  product_name?: string;
  product_sku?: string;
  platform_name?: string;
  platform_display_name?: string;
  template_name?: string;
}

// Project model
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  budget?: number;
  owner_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithDetails extends Project {
  owner_name?: string;
  created_by_name?: string;
  task_count?: number;
  completed_task_count?: number;
  member_count?: number;
}

// Task model
export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  parent_task_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWithDetails extends Task {
  assigned_to_name?: string;
  created_by_name?: string;
  project_name?: string;
  subtask_count?: number;
  completed_subtask_count?: number;
}

// Project Member model
export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'member' | 'viewer';
  joined_at: string;
}

export interface ProjectMemberWithDetails extends ProjectMember {
  user_name?: string;
  user_email?: string;
}

// Task Comment model
export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCommentWithDetails extends TaskComment {
  user_name?: string;
}
