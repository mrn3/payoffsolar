import {getOne, executeSingle, executeQuery} from '../mysql/connection';
import { generateProductSlug } from '@/lib/utils/slug';

// Contact model
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  user_id?: string;
  facebook_user_id?: string;
  created_at: string;
  updated_at: string;
}

// Facebook Conversation model
export interface FacebookConversation {
  id: string;
  contact_id: string;
  facebook_user_id: string;
  facebook_page_id: string;
  conversation_id: string;
  user_name: string;
  user_profile_pic?: string;
  last_message_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Facebook Message model
export interface FacebookMessage {
  id: string;
  conversation_id: string;
  facebook_message_id: string;
  sender_id: string;
  recipient_id: string;
  message_text?: string;
  message_type: 'text' | 'image' | 'file' | 'sticker' | 'quick_reply' | 'postback';
  attachments?: any;
  is_from_page: boolean;
  timestamp: number;
  created_at: string;
}

// Email Communication model
export interface EmailCommunication {
  id: string;
  contact_id: string;
  direction: 'inbound' | 'outbound';
  from_email: string;
  to_email: string;
  cc_emails?: string[];
  bcc_emails?: string[];
  subject?: string;
  body_text?: string;
  body_html?: string;
  message_id?: string;
  thread_id?: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  sent_at: string;
  created_at: string;
  updated_at: string;
}

// SMS Communication model
export interface SMSCommunication {
  id: string;
  contact_id: string;
  direction: 'inbound' | 'outbound';
  from_phone: string;
  to_phone: string;
  message_text: string;
  status: 'sent' | 'delivered' | 'failed' | 'undelivered';
  provider?: string;
  provider_message_id?: string;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

// Combined Communication History item
export interface CommunicationHistoryItem {
  id: string;
  type: 'facebook' | 'email' | 'sms';
  contact_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  subject?: string;
  timestamp: string;
  status?: string;
  metadata?: any;
}

export const ContactModel = {
  async getAll(limit = 50, offset = 0): Promise<Contact[]> {
    return executeQuery<Contact>(
      'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  },

  async getById(_id: string): Promise<Contact | null> {
    return getOne<Contact>('SELECT * FROM contacts WHERE id = ?', [_id]);
  },

  async getByEmail(email: string): Promise<Contact | null> {
    return getOne<Contact>('SELECT * FROM contacts WHERE email = ?', [email]);
  },

  async create(data: Omit<Contact, 'id' | 'updated_at'> & { created_at?: string }): Promise<string> {
    const { created_at, ...contactData } = data;

    if (created_at) {
      // Insert with custom created_at
      await executeSingle(
        'INSERT INTO contacts (name, email, phone, address, city, state, zip, notes, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [contactData.name, contactData.email || '', contactData.phone || '', contactData.address || '', contactData.city || '', contactData.state || '', contactData.zip || '', contactData.notes || null, contactData.user_id || null, created_at]
      );
    } else {
      // Insert with default created_at (current timestamp)
      await executeSingle(
        'INSERT INTO contacts (name, email, phone, address, city, state, zip, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [contactData.name, contactData.email || '', contactData.phone || '', contactData.address || '', contactData.city || '', contactData.state || '', contactData.zip || '', contactData.notes || null, contactData.user_id || null]
      );
    }

    const contact = await getOne<{ id: string }>(
      'SELECT id FROM contacts WHERE name = ? AND email = ? ORDER BY created_at DESC LIMIT 1',
      [contactData.name, contactData.email || '']
    );
    return contact!.id;
  },

  async update(_id: string, _data: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (_data.name !== undefined) { fields.push('name = ? '); values.push(_data.name); }
    if (_data.email !== undefined) { fields.push('email = ? '); values.push(_data.email); }
    if (_data.phone !== undefined) { fields.push('phone = ? '); values.push(_data.phone); }
    if (_data.address !== undefined) { fields.push('address = ? '); values.push(_data.address); }
    if (_data.city !== undefined) { fields.push('city = ? '); values.push(_data.city); }
    if (_data.state !== undefined) { fields.push('state = ?'); values.push(_data.state); }
    if (_data.zip !== undefined) { fields.push('zip = ? '); values.push(_data.zip); }
    if (_data.notes !== undefined) { fields.push('notes = ? '); values.push(_data.notes); }
    if (_data.user_id !== undefined) { fields.push('user_id = ? '); values.push(_data.user_id); }
    if (_data.facebook_user_id !== undefined) { fields.push('facebook_user_id = ? '); values.push(_data.facebook_user_id); }

    if (fields.length === 0) return;

    values.push(_id);
    await executeSingle(
      `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Special update method for merge operations that allows updating created_at
  async updateForMerge(_id: string, _data: Partial<Omit<Contact, 'id' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (_data.name !== undefined) { fields.push('name = ? '); values.push(_data.name); }
    if (_data.email !== undefined) { fields.push('email = ? '); values.push(_data.email); }
    if (_data.phone !== undefined) { fields.push('phone = ? '); values.push(_data.phone); }
    if (_data.address !== undefined) { fields.push('address = ? '); values.push(_data.address); }
    if (_data.city !== undefined) { fields.push('city = ? '); values.push(_data.city); }
    if (_data.state !== undefined) { fields.push('state = ?'); values.push(_data.state); }
    if (_data.zip !== undefined) { fields.push('zip = ? '); values.push(_data.zip); }
    if (_data.notes !== undefined) { fields.push('notes = ? '); values.push(_data.notes); }
    if (_data.user_id !== undefined) { fields.push('user_id = ? '); values.push(_data.user_id); }
    if (_data.created_at !== undefined) { fields.push('created_at = ? '); values.push(_data.created_at); }

    if (fields.length === 0) return;

    const query = `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`;
    values.push(_id);



    await executeSingle(query, values);
  },

  async delete(_id: string): Promise<void> {
    await executeSingle('DELETE FROM contacts WHERE id = ? ', [_id]);
  },

  async deleteAll(): Promise<number> {
    const countResult = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM contacts');
    const count = countResult?.count || 0;

    if (count > 0) {
      await executeSingle('DELETE FROM contacts');
    }

    return count;
  },

  async search(query: string, limit = 50, offset = 0): Promise<Contact[]> {
    const searchTerm = `%${query}%`;
    return executeQuery<Contact>(
      `SELECT * FROM contacts
       WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, limit, offset]
    );
  },

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM contacts');
    return result?.count || 0;
  },

  async getCountWithEmail(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM contacts WHERE email IS NOT NULL AND email != ""');
    return result?.count || 0;
  },

  async getCountWithPhone(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM contacts WHERE phone IS NOT NULL AND phone != ""');
    return result?.count || 0;
  },

  async getSearchCount(query: string): Promise<number> {
    const searchTerm = `%${query}%`;
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM contacts WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?',
      [searchTerm, searchTerm, searchTerm]
    );
    return result?.count || 0;
  },

  async getByFacebookUserId(facebookUserId: string): Promise<Contact | null> {
    return getOne<Contact>('SELECT * FROM contacts WHERE facebook_user_id = ?', [facebookUserId]);
  },

  async createFromFacebook(data: {
    name: string;
    facebook_user_id: string;
    email?: string;
    notes?: string;
  }): Promise<string> {
    await executeSingle(
      'INSERT INTO contacts (name, email, phone, address, city, state, zip, notes, facebook_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.email || '', '', '', '', '', '', data.notes || null, data.facebook_user_id]
    );

    const contact = await getOne<{ id: string }>(
      'SELECT id FROM contacts WHERE facebook_user_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.facebook_user_id]
    );
    return contact!.id;
  }
};

// Facebook Conversation model
export const FacebookConversationModel = {
  async getAll(limit = 50, offset = 0): Promise<FacebookConversation[]> {
    return executeQuery<FacebookConversation>(
      'SELECT * FROM facebook_conversations ORDER BY last_message_time DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  },

  async getById(id: string): Promise<FacebookConversation | null> {
    return getOne<FacebookConversation>('SELECT * FROM facebook_conversations WHERE id = ?', [id]);
  },

  async getByContactId(contactId: string): Promise<FacebookConversation | null> {
    return getOne<FacebookConversation>('SELECT * FROM facebook_conversations WHERE contact_id = ?', [contactId]);
  },

  async getByFacebookUserId(facebookUserId: string): Promise<FacebookConversation | null> {
    return getOne<FacebookConversation>('SELECT * FROM facebook_conversations WHERE facebook_user_id = ?', [facebookUserId]);
  },

  async create(data: Omit<FacebookConversation, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO facebook_conversations (contact_id, facebook_user_id, facebook_page_id, conversation_id, user_name, user_profile_pic, last_message_time, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.contact_id, data.facebook_user_id, data.facebook_page_id, data.conversation_id, data.user_name, data.user_profile_pic || null, data.last_message_time, data.is_active]
    );

    const conversation = await getOne<{ id: string }>(
      'SELECT id FROM facebook_conversations WHERE facebook_user_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.facebook_user_id]
    );
    return conversation!.id;
  },

  async updateLastMessageTime(id: string, timestamp: string): Promise<void> {
    await executeSingle(
      'UPDATE facebook_conversations SET last_message_time = ? WHERE id = ?',
      [timestamp, id]
    );
  },

  async getWithContactInfo(limit = 50, offset = 0): Promise<Array<FacebookConversation & { contact_name: string }>> {
    return executeQuery<FacebookConversation & { contact_name: string }>(
      `SELECT fc.*, c.name as contact_name
       FROM facebook_conversations fc
       LEFT JOIN contacts c ON fc.contact_id = c.id
       ORDER BY fc.last_message_time DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }
};

// Facebook Message model
export const FacebookMessageModel = {
  async getByConversationId(conversationId: string, limit = 50, offset = 0): Promise<FacebookMessage[]> {
    return executeQuery<FacebookMessage>(
      'SELECT * FROM facebook_messages WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [conversationId, limit, offset]
    );
  },

  async getById(id: string): Promise<FacebookMessage | null> {
    return getOne<FacebookMessage>('SELECT * FROM facebook_messages WHERE id = ?', [id]);
  },

  async getByFacebookMessageId(facebookMessageId: string): Promise<FacebookMessage | null> {
    return getOne<FacebookMessage>('SELECT * FROM facebook_messages WHERE facebook_message_id = ?', [facebookMessageId]);
  },

  async create(data: Omit<FacebookMessage, 'id' | 'created_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO facebook_messages (conversation_id, facebook_message_id, sender_id, recipient_id, message_text, message_type, attachments, is_from_page, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.conversation_id, data.facebook_message_id, data.sender_id, data.recipient_id, data.message_text || null, data.message_type, JSON.stringify(data.attachments) || null, data.is_from_page, data.timestamp]
    );

    const message = await getOne<{ id: string }>(
      'SELECT id FROM facebook_messages WHERE facebook_message_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.facebook_message_id]
    );
    return message!.id;
  },

  async getRecentByConversationId(conversationId: string, limit = 10): Promise<FacebookMessage[]> {
    return executeQuery<FacebookMessage>(
      'SELECT * FROM facebook_messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT ?',
      [conversationId, limit]
    );
  }
};

// Product Category model
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export const ProductCategoryModel = {
  async getAll(): Promise<ProductCategory[]> {
    return executeQuery<ProductCategory>(
      'SELECT * FROM product_categories ORDER BY name'
    );
  },

  async getById(id: string): Promise<ProductCategory | null> {
    return getOne<ProductCategory>('SELECT * FROM product_categories WHERE id = ?', [id]);
  },

  async create(data: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    // Generate slug from name if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    await executeSingle(
      'INSERT INTO product_categories (name, description, slug, parent_id) VALUES (?, ?, ?, ?)',
      [data.name, data.description || null, slug, data.parent_id || null]
    );

    const category = await getOne<{ id: string }>(
      'SELECT id FROM product_categories WHERE slug = ? ORDER BY created_at DESC LIMIT 1',
      [slug]
    );
    return category!.id;
  },

  async update(id: string, data: Partial<Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.slug !== undefined) {
      updates.push('slug = ?');
      values.push(data.slug);
    }
    if (data.parent_id !== undefined) {
      updates.push('parent_id = ?');
      values.push(data.parent_id);
    }

    if (updates.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE product_categories SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    // Check if category is being used by products
    const productCount = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (productCount && productCount.count > 0) {
      throw new Error(`Cannot delete category: ${productCount.count} products are using this category`);
    }

    // Check if category has subcategories
    const subcategoryCount = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM product_categories WHERE parent_id = ?',
      [id]
    );

    if (subcategoryCount && subcategoryCount.count > 0) {
      throw new Error(`Cannot delete category: ${subcategoryCount.count} subcategories exist`);
    }

    await executeSingle('DELETE FROM product_categories WHERE id = ?', [id]);
  },

  async getUsageStats(): Promise<(ProductCategory & { product_count: number })[]> {
    return executeQuery<ProductCategory & { product_count: number }>(
      `SELECT pc.*, COALESCE(p.product_count, 0) as product_count
       FROM product_categories pc
       LEFT JOIN (
         SELECT category_id, COUNT(*) as product_count
         FROM products
         WHERE category_id IS NOT NULL
         GROUP BY category_id
       ) p ON pc.id = p.category_id
       ORDER BY pc.name`
    );
  },

  async getBySlug(slug: string): Promise<ProductCategory | null> {
    return getOne<ProductCategory>('SELECT * FROM product_categories WHERE slug = ?', [slug]);
  }
};

// Shipping method types
export interface ShippingMethod {
  type: 'free' | 'fixed' | 'calculated_distance' | 'api_calculated' | 'local_pickup';
  name: string;
  description?: string;
  cost?: number; // For fixed amount
  warehouse_id?: string; // For distance calculation
  pickup_location?: string; // For local pickup
  api_config?: {
    provider: string;
    settings: Record<string, any>;
  };
}

// Product model
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category_name?: string;
}

// Product image model
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

// Helper function to parse shipping methods from JSON
function parseShippingMethods(product: any): Product {
  if (product.shipping_methods && typeof product.shipping_methods === 'string') {
    try {
      product.shipping_methods = JSON.parse(product.shipping_methods);
    } catch (e) {
      product.shipping_methods = null;
    }
  }
  return product;
}

export const ProductModel = {
  async getAll(limit = 50, offset = 0, sort = ''): Promise<ProductWithFirstImage[]> {
    let orderBy = 'p.created_at DESC'; // default sort

    switch (sort) {
      case 'name_asc':
        orderBy = 'p.name ASC';
        break;
      case 'name_desc':
        orderBy = 'p.name DESC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
    }

    return executeQuery<ProductWithFirstImage>(
      `SELECT p.*, pc.name as category_name,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC, pi.created_at ASC
        LIMIT 1) as first_image_url
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.is_active = TRUE
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async getAllIncludingInactive(limit = 50, offset = 0): Promise<ProductWithFirstImage[]> {
    return executeQuery<ProductWithFirstImage>(
      `SELECT p.*, pc.name as category_name,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC, pi.created_at ASC
        LIMIT 1) as first_image_url
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async search(query: string, limit = 50, offset = 0, sort = ''): Promise<ProductWithFirstImage[]> {
    const searchTerm = `%${query}%`;
    let orderBy = 'p.created_at DESC'; // default sort

    switch (sort) {
      case 'name_asc':
        orderBy = 'p.name ASC';
        break;
      case 'name_desc':
        orderBy = 'p.name DESC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
    }

    return executeQuery<ProductWithFirstImage>(
      `SELECT p.*, pc.name as category_name,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC, pi.created_at ASC
        LIMIT 1) as first_image_url
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.is_active = TRUE AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, limit, offset]
    );
  },

  async searchIncludingInactive(query: string, limit = 50, offset = 0, sort = ''): Promise<ProductWithFirstImage[]> {
    const searchTerm = `%${query}%`;
    let orderBy = 'p.created_at DESC'; // default sort

    switch (sort) {
      case 'name_asc':
        orderBy = 'p.name ASC';
        break;
      case 'name_desc':
        orderBy = 'p.name DESC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
    }

    return executeQuery<ProductWithFirstImage>(
      `SELECT p.*, pc.name as category_name,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC, pi.created_at ASC
        LIMIT 1) as first_image_url
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, limit, offset]
    );
  },

  async getById(_id: string): Promise<Product | null> {
    const product = await getOne<Product>('SELECT * FROM products WHERE id = ?', [_id]);
    return product ? parseShippingMethods(product) : null;
  },

  async getBySku(sku: string): Promise<Product | null> {
    const product = await getOne<Product>('SELECT * FROM products WHERE sku = ?', [sku]);
    return product ? parseShippingMethods(product) : null;
  },

  async getBySlug(slug: string): Promise<Product | null> {
    const product = await getOne<Product>('SELECT * FROM products WHERE slug = ? AND is_active = TRUE', [slug]);
    return product ? parseShippingMethods(product) : null;
  },

  async create(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    // Generate slug if not provided
    const slug = data.slug || generateProductSlug(data.name, data.sku);

    await executeSingle(
      'INSERT INTO products (name, description, price, image_url, data_sheet_url, category_id, sku, slug, tax_percentage, shipping_methods, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.description, data.price, data.image_url || null, data.data_sheet_url || null, data.category_id || null, data.sku, slug, data.tax_percentage || 0, data.shipping_methods ? JSON.stringify(data.shipping_methods) : null, data.is_active]
    );

    const product = await getOne<{ id: string }>(
      'SELECT id FROM products WHERE name = ? AND sku = ? ORDER BY created_at DESC LIMIT 1',
      [data.name, data.sku]
    );
    return product!.id;
  },

  async update(id: string, data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.price !== undefined) {
      fields.push('price = ?');
      values.push(data.price);
    }
    if (data.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(data.image_url);
    }
    if (data.data_sheet_url !== undefined) {
      fields.push('data_sheet_url = ?');
      values.push(data.data_sheet_url);
    }
    if (data.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(data.category_id);
    }
    if (data.sku !== undefined) {
      fields.push('sku = ?');
      values.push(data.sku);
    }
    if (data.slug !== undefined) {
      fields.push('slug = ?');
      values.push(data.slug);
    }
    if (data.tax_percentage !== undefined) {
      fields.push('tax_percentage = ?');
      values.push(data.tax_percentage);
    }
    if (data.shipping_methods !== undefined) {
      fields.push('shipping_methods = ?');
      values.push(data.shipping_methods ? JSON.stringify(data.shipping_methods) : null);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(_id: string): Promise<void> {
    await executeSingle('DELETE FROM products WHERE id = ? ', [_id]);
  },

  async deleteAll(): Promise<number> {
    const countResult = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM products');
    const count = countResult?.count || 0;

    if (count > 0) {
      // Delete all product images first (due to foreign key constraints)
      await executeSingle('DELETE FROM product_images');
      // Then delete all products
      await executeSingle('DELETE FROM products');
    }

    return count;
  },

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
    return result?.count || 0;
  },

  async getTotalCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM products');
    return result?.count || 0;
  },

  async getSearchCount(query: string): Promise<number> {
    const searchTerm = `%${query}%`;
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE is_active = TRUE AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)',
      [searchTerm, searchTerm, searchTerm]
    );
    return result?.count || 0;
  },

  async getSearchCountIncludingInactive(query: string): Promise<number> {
    const searchTerm = `%${query}%`;
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE (name LIKE ? OR description LIKE ? OR sku LIKE ?)',
      [searchTerm, searchTerm, searchTerm]
    );
    return result?.count || 0;
  },

  async getByCategory(_categoryId: string, limit = 50, offset = 0, sort = ''): Promise<ProductWithFirstImage[]> {
    let orderBy = 'p.created_at DESC'; // default sort

    switch (sort) {
      case 'name_asc':
        orderBy = 'p.name ASC';
        break;
      case 'name_desc':
        orderBy = 'p.name DESC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
    }

    return executeQuery<ProductWithFirstImage>(
      `SELECT p.*, pc.name as category_name,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC, pi.created_at ASC
        LIMIT 1) as first_image_url
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.is_active = TRUE AND p.category_id = ?
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [_categoryId, limit, offset]
    );
  },

  async getCategoryCount(categoryId: string): Promise<number> {
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE is_active = TRUE AND category_id = ?',
      [categoryId]
    );
    return result?.count || 0;
  },

  async getByCategoryIncludingInactive(categoryId: string, limit = 50, offset = 0, sort = ''): Promise<ProductWithFirstImage[]> {
    let orderBy = 'p.created_at DESC'; // default sort

    switch (sort) {
      case 'name_asc':
        orderBy = 'p.name ASC';
        break;
      case 'name_desc':
        orderBy = 'p.name DESC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
    }

    return executeQuery<ProductWithFirstImage>(
      `SELECT p.*, pc.name as category_name,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC, pi.created_at ASC
        LIMIT 1) as first_image_url
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.category_id = ?
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [categoryId, limit, offset]
    );
  },

  async getCategoryCountIncludingInactive(categoryId: string): Promise<number> {
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [categoryId]
    );
    return result?.count || 0;
  },

  async searchByCategory(query: string, categoryId: string, limit = 50, offset = 0, sort = ''): Promise<ProductWithFirstImage[]> {
    const searchTerm = `%${query}%`;
    let orderBy = 'p.created_at DESC'; // default sort

    switch (sort) {
      case 'name_asc':
        orderBy = 'p.name ASC';
        break;
      case 'name_desc':
        orderBy = 'p.name DESC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
    }

    return executeQuery<ProductWithFirstImage>(
      `SELECT p.*, pc.name as category_name,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC, pi.created_at ASC
        LIMIT 1) as first_image_url
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.is_active = TRUE AND p.category_id = ? AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [categoryId, searchTerm, searchTerm, searchTerm, limit, offset]
    );
  },

  async getSearchByCategoryCount(query: string, categoryId: string): Promise<number> {
    const searchTerm = `%${query}%`;
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE is_active = TRUE AND category_id = ? AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)',
      [categoryId, searchTerm, searchTerm, searchTerm]
    );
    return result?.count || 0;
  },

  async searchByCategoryIncludingInactive(query: string, categoryId: string, limit = 50, offset = 0, sort = ''): Promise<ProductWithFirstImage[]> {
    const searchTerm = `%${query}%`;
    let orderBy = 'p.created_at DESC'; // default sort

    switch (sort) {
      case 'name_asc':
        orderBy = 'p.name ASC';
        break;
      case 'name_desc':
        orderBy = 'p.name DESC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
    }

    return executeQuery<ProductWithFirstImage>(
      `SELECT p.*, pc.name as category_name,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC, pi.created_at ASC
        LIMIT 1) as first_image_url
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.category_id = ? AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [categoryId, searchTerm, searchTerm, searchTerm, limit, offset]
    );
  },

  async getSearchByCategoryCountIncludingInactive(query: string, categoryId: string): Promise<number> {
    const searchTerm = `%${query}%`;
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)',
      [categoryId, searchTerm, searchTerm, searchTerm]
    );
    return result?.count || 0;
  }
};

export const ProductImageModel = {
  async getByProductId(productId: string): Promise<ProductImage[]> {
    return executeQuery<ProductImage>(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, created_at ASC',
      [productId]
    );
  },

  async create(data: Omit<ProductImage, 'id' | 'created_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO product_images (product_id, image_url, alt_text, sort_order) VALUES (?, ?, ?, ?)',
      [data.product_id, data.image_url, data.alt_text || null, data.sort_order]
    );

    const image = await getOne<{ id: string }>(
      'SELECT id FROM product_images WHERE product_id = ? AND image_url = ? ORDER BY created_at DESC LIMIT 1',
      [data.product_id, data.image_url]
    );
    return image!.id;
  },

  async delete(_id: string): Promise<void> {
    await executeSingle('DELETE FROM product_images WHERE id = ? ', [_id]);
  },

  async deleteByProductId(productId: string): Promise<void> {
    await executeSingle('DELETE FROM product_images WHERE product_id = ? ', [productId]);
  },

  async updateSortOrder(_id: string, sortOrder: number): Promise<void> {
    await executeSingle('UPDATE product_images SET sort_order = ? WHERE id = ? ', [sortOrder, _id]);
  }
};

// Order model
export interface Order {
  id: string;
  contact_id: string;
  status: string;
  total: number | string;
  order_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithContact extends Order {
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_city?: string;
  contact_state?: string;
  contact_address?: string;
  total_internal_cost?: number;
}

// Order Item model
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

export interface OrderWithItems extends OrderWithContact {
  items?: OrderItemWithProduct[];
  costItems?: CostItemWithCategory[];
}

// Cost Category model
export interface CostCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Cost Item model
export interface CostItem {
  id: string;
  order_id: string;
  category_id: string;
  amount: number | string;
  created_at: string;
  updated_at: string;
}

export interface CostItemWithCategory extends CostItem {
  category_name?: string;
}

// Listing Platform model
export interface ListingPlatform {
  id: string;
  name: string;
  display_name: string;
  api_endpoint?: string;
  requires_auth: boolean;
  is_active: boolean;
  configuration: Record<string, any>;
  credentials?: Record<string, any>; // For frontend use only
  created_at: string;
  updated_at: string;
}

// Listing Template model
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

// Product Listing model
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

// Listing Image model
export interface ListingImage {
  id: string;
  listing_id: string;
  product_image_id?: string;
  external_image_id?: string;
  image_url: string;
  sort_order: number;
  upload_status: 'pending' | 'uploaded' | 'failed';
  created_at: string;
}

// Platform Credentials model
export interface PlatformCredentials {
  id: string;
  platform_id: string;
  user_id: string;
  credential_type: 'api_key' | 'oauth' | 'username_password';
  credentials: Record<string, any>;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformCredentialsWithPlatform extends PlatformCredentials {
  platform_name?: string;
  platform_display_name?: string;
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

// Project Model
export const ProjectModel = {
  async getAll(limit?: number, offset?: number): Promise<ProjectWithDetails[]> {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const offsetClause = offset ? `OFFSET ${offset}` : '';

    const projects = await executeQuery<ProjectWithDetails>(
      `SELECT
        p.*,
        CONCAT(owner.first_name, ' ', owner.last_name) as owner_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_task_count,
        COUNT(DISTINCT pm.user_id) as member_count
       FROM projects p
       LEFT JOIN profiles owner ON p.owner_id = owner.id
       LEFT JOIN profiles creator ON p.created_by = creator.id
       LEFT JOIN tasks t ON p.id = t.project_id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       GROUP BY p.id
       ORDER BY p.updated_at DESC
       ${limitClause} ${offsetClause}`,
      []
    );
    return projects || [];
  },

  async getById(id: string): Promise<ProjectWithDetails | null> {
    const project = await getOne<ProjectWithDetails>(
      `SELECT
        p.*,
        CONCAT(owner.first_name, ' ', owner.last_name) as owner_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_task_count,
        COUNT(DISTINCT pm.user_id) as member_count
       FROM projects p
       LEFT JOIN profiles owner ON p.owner_id = owner.id
       LEFT JOIN profiles creator ON p.created_by = creator.id
       LEFT JOIN tasks t ON p.id = t.project_id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [id]
    );
    return project;
  },

  async create(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO projects (name, description, status, priority, start_date, due_date, budget, owner_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.description || null, data.status, data.priority, data.start_date || null, data.due_date || null, data.budget || null, data.owner_id || null, data.created_by]
    );

    const project = await getOne<{ id: string }>(
      'SELECT id FROM projects WHERE name = ? AND created_by = ? ORDER BY created_at DESC LIMIT 1',
      [data.name, data.created_by]
    );
    return project!.id;
  },

  async update(id: string, data: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description || null);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(data.start_date || null);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date || null);
    }
    if (data.completion_date !== undefined) {
      fields.push('completion_date = ?');
      values.push(data.completion_date || null);
    }
    if (data.budget !== undefined) {
      fields.push('budget = ?');
      values.push(data.budget || null);
    }
    if (data.owner_id !== undefined) {
      fields.push('owner_id = ?');
      values.push(data.owner_id || null);
    }

    if (fields.length > 0) {
      values.push(id);
      await executeSingle(
        `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM projects WHERE id = ?', [id]);
  },

  async getByStatus(status: string): Promise<ProjectWithDetails[]> {
    const projects = await executeQuery<ProjectWithDetails>(
      `SELECT
        p.*,
        CONCAT(owner.first_name, ' ', owner.last_name) as owner_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_task_count,
        COUNT(DISTINCT pm.user_id) as member_count
       FROM projects p
       LEFT JOIN profiles owner ON p.owner_id = owner.id
       LEFT JOIN profiles creator ON p.created_by = creator.id
       LEFT JOIN tasks t ON p.id = t.project_id
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.status = ?
       GROUP BY p.id
       ORDER BY p.updated_at DESC`,
      [status]
    );
    return projects || [];
  }
};

// Task Model
export const TaskModel = {
  async getAll(limit?: number, offset?: number): Promise<TaskWithDetails[]> {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const offsetClause = offset ? `OFFSET ${offset}` : '';

    const tasks = await executeQuery<TaskWithDetails>(
      `SELECT
        t.*,
        CONCAT(assigned.first_name, ' ', assigned.last_name) as assigned_to_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        p.name as project_name,
        COUNT(DISTINCT st.id) as subtask_count,
        COUNT(DISTINCT CASE WHEN st.status = 'completed' THEN st.id END) as completed_subtask_count
       FROM tasks t
       LEFT JOIN profiles assigned ON t.assigned_to = assigned.id
       LEFT JOIN profiles creator ON t.created_by = creator.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN tasks st ON t.id = st.parent_task_id
       GROUP BY t.id
       ORDER BY t.sort_order ASC, t.created_at DESC
       ${limitClause} ${offsetClause}`,
      []
    );
    return tasks || [];
  },

  async getByProjectId(projectId: string): Promise<TaskWithDetails[]> {
    const tasks = await executeQuery<TaskWithDetails>(
      `SELECT
        t.*,
        CONCAT(assigned.first_name, ' ', assigned.last_name) as assigned_to_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        p.name as project_name,
        COUNT(DISTINCT st.id) as subtask_count,
        COUNT(DISTINCT CASE WHEN st.status = 'completed' THEN st.id END) as completed_subtask_count
       FROM tasks t
       LEFT JOIN profiles assigned ON t.assigned_to = assigned.id
       LEFT JOIN profiles creator ON t.created_by = creator.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN tasks st ON t.id = st.parent_task_id
       WHERE t.project_id = ?
       GROUP BY t.id
       ORDER BY t.sort_order ASC, t.created_at DESC`,
      [projectId]
    );
    return tasks || [];
  },

  async getById(id: string): Promise<TaskWithDetails | null> {
    const task = await getOne<TaskWithDetails>(
      `SELECT
        t.*,
        CONCAT(assigned.first_name, ' ', assigned.last_name) as assigned_to_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        p.name as project_name,
        COUNT(DISTINCT st.id) as subtask_count,
        COUNT(DISTINCT CASE WHEN st.status = 'completed' THEN st.id END) as completed_subtask_count
       FROM tasks t
       LEFT JOIN profiles assigned ON t.assigned_to = assigned.id
       LEFT JOIN profiles creator ON t.created_by = creator.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN tasks st ON t.id = st.parent_task_id
       WHERE t.id = ?
       GROUP BY t.id`,
      [id]
    );
    return task;
  },

  async create(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, created_by, start_date, due_date, estimated_hours, parent_task_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.project_id, data.title, data.description || null, data.status, data.priority, data.assigned_to || null, data.created_by, data.start_date || null, data.due_date || null, data.estimated_hours || null, data.parent_task_id || null, data.sort_order]
    );

    const task = await getOne<{ id: string }>(
      'SELECT id FROM tasks WHERE title = ? AND project_id = ? AND created_by = ? ORDER BY created_at DESC LIMIT 1',
      [data.title, data.project_id, data.created_by]
    );
    return task!.id;
  },

  async update(id: string, data: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description || null);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);

      // Set completion date when marking as completed
      if (data.status === 'completed') {
        fields.push('completion_date = ?');
        values.push(new Date().toISOString().split('T')[0]);
      }
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.assigned_to !== undefined) {
      fields.push('assigned_to = ?');
      values.push(data.assigned_to || null);
    }
    if (data.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(data.start_date || null);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date || null);
    }
    if (data.estimated_hours !== undefined) {
      fields.push('estimated_hours = ?');
      values.push(data.estimated_hours || null);
    }
    if (data.actual_hours !== undefined) {
      fields.push('actual_hours = ?');
      values.push(data.actual_hours || null);
    }
    if (data.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(data.sort_order);
    }

    if (fields.length > 0) {
      values.push(id);
      await executeSingle(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM tasks WHERE id = ?', [id]);
  },

  async getByAssignedUser(userId: string): Promise<TaskWithDetails[]> {
    const tasks = await executeQuery<TaskWithDetails>(
      `SELECT
        t.*,
        CONCAT(assigned.first_name, ' ', assigned.last_name) as assigned_to_name,
        CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name,
        p.name as project_name,
        COUNT(DISTINCT st.id) as subtask_count,
        COUNT(DISTINCT CASE WHEN st.status = 'completed' THEN st.id END) as completed_subtask_count
       FROM tasks t
       LEFT JOIN profiles assigned ON t.assigned_to = assigned.id
       LEFT JOIN profiles creator ON t.created_by = creator.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN tasks st ON t.id = st.parent_task_id
       WHERE t.assigned_to = ?
       GROUP BY t.id
       ORDER BY t.sort_order ASC, t.created_at DESC`,
      [userId]
    );
    return tasks || [];
  }
};

// User Model for project/task assignments
export const UserModel = {
  async getAll(): Promise<{ id: string; name: string; email: string; role: string }[]> {
    const users = await executeQuery<any>(
      `SELECT
        u.id,
        CONCAT(p.first_name, ' ', p.last_name) as name,
        p.email,
        r.name as role
       FROM users u
       JOIN profiles p ON u.id = p.id
       LEFT JOIN roles r ON p.role_id = r.id
       WHERE r.name != 'contact'
       ORDER BY p.first_name, p.last_name`,
      []
    );
    return users || [];
  },

  async getById(id: string): Promise<{ id: string; name: string; email: string; role: string } | null> {
    const user = await getOne<any>(
      `SELECT
        u.id,
        CONCAT(p.first_name, ' ', p.last_name) as name,
        p.email,
        r.name as role
       FROM users u
       JOIN profiles p ON u.id = p.id
       LEFT JOIN roles r ON p.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );
    return user;
  }
};

// Product Cost Breakdown model
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

// Cart item interface for frontend cart management
export interface CartItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_price: number;
  product_image_url?: string;
  product_tax_percentage: number;
  quantity: number;
}

export const OrderModel = {
  async getAll(limit = 50, offset = 0): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*,
              c.name as contact_name,
              c.city as contact_city,
              c.state as contact_state,
              c.address as contact_address,
              COALESCE(SUM(ci.amount), 0) as total_internal_cost
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       LEFT JOIN cost_items ci ON o.id = ci.order_id
       GROUP BY o.id, c.name, c.city, c.state, c.address
       ORDER BY o.order_date DESC, o.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async search(query: string, limit = 50, offset = 0): Promise<OrderWithContact[]> {
    const searchTerm = `%${query}%`;
    return executeQuery<OrderWithContact>(
      `SELECT o.*, c.name as contact_name, c.city as contact_city, c.state as contact_state, c.address as contact_address
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE c.name LIKE ?
       ORDER BY o.order_date DESC, o.created_at DESC LIMIT ? OFFSET ?`,
      [searchTerm, limit, offset]
    );
  },

  async getSearchCount(query: string): Promise<number> {
    const searchTerm = `%${query}%`;
    const result = await getOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE c.name LIKE ?`,
      [searchTerm]
    );
    return result?.count || 0;
  },

  async searchWithFilters(filters: {
    search?: string;
    contactName?: string;
    city?: string;
    state?: string;
    status?: string;
    minTotal?: number | null;
    maxTotal?: number | null;
    startDate?: string;
    endDate?: string;
  }, limit = 50, offset = 0): Promise<OrderWithContact[]> {
    const conditions = [];
    const params = [];

    // General search (legacy support)
    if (filters.search) {
      conditions.push('c.name LIKE ?');
      params.push(`%${filters.search}%`);
    }

    // Contact name filter
    if (filters.contactName) {
      conditions.push('c.name LIKE ?');
      params.push(`%${filters.contactName}%`);
    }

    // City filter
    if (filters.city) {
      conditions.push('c.city LIKE ?');
      params.push(`%${filters.city}%`);
    }

    // State filter
    if (filters.state) {
      conditions.push('c.state = ?');
      params.push(filters.state);
    }

    // Status filter
    if (filters.status) {
      conditions.push('o.status = ?');
      params.push(filters.status);
    }

    // Total amount range filter
    if (filters.minTotal !== null && filters.minTotal !== undefined) {
      conditions.push('o.total >= ?');
      params.push(filters.minTotal);
    }
    if (filters.maxTotal !== null && filters.maxTotal !== undefined) {
      conditions.push('o.total <= ?');
      params.push(filters.maxTotal);
    }

    // Date range filter
    if (filters.startDate) {
      conditions.push('o.order_date >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('o.order_date <= ?');
      params.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT o.*,
             c.name as contact_name,
             c.city as contact_city,
             c.state as contact_state,
             c.address as contact_address,
             COALESCE(SUM(ci.amount), 0) as total_internal_cost
      FROM orders o
      LEFT JOIN contacts c ON o.contact_id = c.id
      LEFT JOIN cost_items ci ON o.id = ci.order_id
      ${whereClause}
      GROUP BY o.id, c.name, c.city, c.state, c.address
      ORDER BY o.order_date DESC, o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    return executeQuery<OrderWithContact>(query, params);
  },

  async getFilteredCount(filters: {
    search?: string;
    contactName?: string;
    city?: string;
    state?: string;
    status?: string;
    minTotal?: number | null;
    maxTotal?: number | null;
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    const conditions = [];
    const params = [];

    // General search (legacy support)
    if (filters.search) {
      conditions.push('c.name LIKE ?');
      params.push(`%${filters.search}%`);
    }

    // Contact name filter
    if (filters.contactName) {
      conditions.push('c.name LIKE ?');
      params.push(`%${filters.contactName}%`);
    }

    // City filter
    if (filters.city) {
      conditions.push('c.city LIKE ?');
      params.push(`%${filters.city}%`);
    }

    // State filter
    if (filters.state) {
      conditions.push('c.state = ?');
      params.push(filters.state);
    }

    // Status filter
    if (filters.status) {
      conditions.push('o.status = ?');
      params.push(filters.status);
    }

    // Total amount range filter
    if (filters.minTotal !== null && filters.minTotal !== undefined) {
      conditions.push('o.total >= ?');
      params.push(filters.minTotal);
    }
    if (filters.maxTotal !== null && filters.maxTotal !== undefined) {
      conditions.push('o.total <= ?');
      params.push(filters.maxTotal);
    }

    // Date range filter
    if (filters.startDate) {
      conditions.push('o.order_date >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('o.order_date <= ?');
      params.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT COUNT(*) as count
      FROM orders o
      LEFT JOIN contacts c ON o.contact_id = c.id
      ${whereClause}
    `;

    const result = await getOne<{ count: number }>(query, params);
    return result?.count || 0;
  },

  async getAllByUser(_userId: string, limit = 50, offset = 0): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*,
              c.name as contact_name,
              c.city as contact_city,
              c.state as contact_state,
              c.address as contact_address,
              COALESCE(SUM(ci.amount), 0) as total_internal_cost
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       LEFT JOIN cost_items ci ON o.id = ci.order_id
       WHERE c.user_id = ?
       GROUP BY o.id, c.name, c.city, c.state, c.address
       ORDER BY o.order_date DESC, o.created_at DESC LIMIT ? OFFSET ?`,
      [_userId, limit, offset]
    );
  },

  async getById(_id: string): Promise<Order | null> {
    return getOne<Order>('SELECT * FROM orders WHERE id = ?', [_id]);
  },

  async getByIdForUser(_id: string, _userId: string): Promise<OrderWithContact | null> {
    return getOne<OrderWithContact>(
      `SELECT o.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE o.id = ? AND c.user_id = ?`,
      [_id, _userId]
    );
  },

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM orders');
    return result?.count || 0;
  },

  async getCountByUser(userId: string): Promise<number> {
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM orders o LEFT JOIN contacts c ON o.contact_id = c.id WHERE c.user_id = ?',
      [userId]
    );
    return result?.count || 0;
  },

  async getCompletionStats(): Promise<{ complete: number; incomplete: number; total: number }> {
    const result = await getOne<{ complete: number; incomplete: number; total: number }>(
      `SELECT
         SUM(CASE WHEN status IN ('complete', 'paid') THEN 1 ELSE 0 END) as complete,
         SUM(CASE WHEN status NOT IN ('complete', 'paid') THEN 1 ELSE 0 END) as incomplete,
         COUNT(*) as total
       FROM orders`
    );
    return result || { complete: 0, incomplete: 0, total: 0 };
  },

  async getCompletionStatsByUser(userId: string): Promise<{ complete: number; incomplete: number; total: number }> {
    const result = await getOne<{ complete: number; incomplete: number; total: number }>(
      `SELECT
         SUM(CASE WHEN o.status IN ('complete', 'paid') THEN 1 ELSE 0 END) as complete,
         SUM(CASE WHEN o.status NOT IN ('complete', 'paid') THEN 1 ELSE 0 END) as incomplete,
         COUNT(*) as total
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE c.user_id = ?`,
      [userId]
    );
    return result || { complete: 0, incomplete: 0, total: 0 };
  },

  async getRecent(limit = 3): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*, c.name as contact_name
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       ORDER BY o.created_at DESC LIMIT ?`,
      [limit]
    );
  },

  async getRecentByUser(_userId: string, limit = 3): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*, c.name as contact_name
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE c.user_id = ?
       ORDER BY o.created_at DESC LIMIT ?`,
      [_userId, limit]
    );
  },

  async getByContactId(contactId: string, limit = 50, offset = 0): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*,
              c.name as contact_name,
              c.city as contact_city,
              c.state as contact_state,
              c.address as contact_address,
              COALESCE(SUM(ci.amount), 0) as total_internal_cost
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       LEFT JOIN cost_items ci ON o.id = ci.order_id
       WHERE o.contact_id = ?
       GROUP BY o.id, c.name, c.city, c.state, c.address
       ORDER BY o.order_date DESC, o.created_at DESC LIMIT ? OFFSET ?`,
      [contactId, limit, offset]
    );
  },

  async getCountByContactId(contactId: string): Promise<number> {
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM orders WHERE contact_id = ?',
      [contactId]
    );
    return result?.count || 0;
  },

  async getRevenueByMonth(months = 12): Promise<Array<{ month: string; revenue: number; count: number }>> {
    return executeQuery<{ month: string; revenue: number; count: number }>(
      `SELECT
         DATE_FORMAT(order_date, '%Y-%m') as month,
         SUM(CAST(total AS DECIMAL(10,2))) as revenue,
         COUNT(*) as count
       FROM orders
       WHERE status = 'complete'
         AND order_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(order_date, '%Y-%m')
       ORDER BY month ASC`,
      [months]
    );
  },

  async getOrdersByMonth(month: string): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*, c.name as contact_name
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE status = 'complete'
         AND DATE_FORMAT(o.order_date, '%Y-%m') = ?
       ORDER BY o.order_date DESC, o.created_at DESC`,
      [month]
    );
  },

  async getOrderCountsByStatusAndMonth(months = 12): Promise<Array<{ month: string; status: string; count: number }>> {
    return executeQuery<{ month: string; status: string; count: number }>(
      `SELECT
         DATE_FORMAT(order_date, '%Y-%m') as month,
         status,
         COUNT(*) as count
       FROM orders
       WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(order_date, '%Y-%m'), status
       ORDER BY month ASC, status ASC`,
      [months]
    );
  },

  async getCostBreakdownByMonth(months = 12, categoryId?: string | null): Promise<Array<{ month: string; category_name: string; total_amount: number }>> {
    const params = [months];
    let categoryFilter = '';

    if (categoryId) {
      categoryFilter = 'AND cc.id = ?';
      params.push(categoryId);
    }

    return executeQuery<{ month: string; category_name: string; total_amount: number }>(
      `SELECT
         DATE_FORMAT(o.order_date, '%Y-%m') as month,
         cc.name as category_name,
         SUM(ci.amount) as total_amount
       FROM orders o
       INNER JOIN cost_items ci ON o.id = ci.order_id
       INNER JOIN cost_categories cc ON ci.category_id = cc.id
       WHERE o.status = 'complete'
         AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
         ${categoryFilter}
       GROUP BY DATE_FORMAT(o.order_date, '%Y-%m'), cc.id, cc.name
       ORDER BY month ASC, cc.name ASC`,
      params
    );
  },

  async getOrdersByMonthAndStatus(month: string, status: string): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*, c.name as contact_name, c.city as contact_city, c.state as contact_state, c.address as contact_address
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE DATE_FORMAT(o.order_date, '%Y-%m') = ?
         AND o.status = ?
       ORDER BY o.order_date DESC, o.created_at DESC`,
      [month, status]
    );
  },

  async getWithItems(_id: string): Promise<OrderWithItems | null> {
    const order = await getOne<OrderWithContact>(
      `SELECT o.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE o.id = ?`,
      [_id]
    );

    if (!order) return null;

    const items = await executeQuery<OrderItemWithProduct>(
      `SELECT oi.*, p.name as product_name, p.sku as product_sku
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?
       ORDER BY oi.created_at ASC`,
      [_id]
    );

    const costItems = await executeQuery<CostItemWithCategory>(
      `SELECT ci.*, cc.name as category_name
       FROM cost_items ci
       LEFT JOIN cost_categories cc ON ci.category_id = cc.id
       WHERE ci.order_id = ?
       ORDER BY ci.created_at ASC`,
      [_id]
    );

    return { ...order, items, costItems };
  },

  async create(data: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO orders (contact_id, status, total, order_date, notes) VALUES (?, ?, ?, ?, ?)',
      [data.contact_id, data.status, data.total, data.order_date, data.notes || null]
    );

    const order = await getOne<{ id: string }>(
      'SELECT id FROM orders WHERE contact_id = ? AND total = ? ORDER BY created_at DESC LIMIT 1',
      [data.contact_id, data.total]
    );
    return order!.id;
  },

  async update(_id: string, _data: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (_data.contact_id !== undefined) {
      fields.push('contact_id = ? ');
      values.push(_data.contact_id);
    }
    if (_data.status !== undefined) {
      fields.push('status = ?');
      values.push(_data.status);
    }
    if (_data.total !== undefined) {
      fields.push('total = ? ');
      values.push(_data.total);
    }
    if (_data.order_date !== undefined) {
      fields.push('order_date = ? ');
      values.push(_data.order_date);
    }
    if (_data.notes !== undefined) {
      fields.push('notes = ? ');
      values.push(_data.notes);
    }

    if (fields.length === 0) return;

    values.push(_id);
    await executeSingle(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(_id: string): Promise<void> {
    await executeSingle('DELETE FROM orders WHERE id = ? ', [_id]);
  },

  async bulkUpdateStatus(orderIds: string[], status: string): Promise<void> {
    if (orderIds.length === 0) return;

    const placeholders = orderIds.map(() => '?').join(',');
    await executeSingle(
      `UPDATE orders SET status = ? WHERE id IN (${placeholders})`,
      [status, ...orderIds]
    );
  },

  async deleteAll(): Promise<number> {
    const countResult = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM orders');
    const count = countResult?.count || 0;

    if (count > 0) {
      // Delete all order items first (due to foreign key constraints)
      await executeSingle('DELETE FROM order_items');
      // Then delete all orders
      await executeSingle('DELETE FROM orders');
    }

    return count;
  }
};

// Order Item model
export const OrderItemModel = {
  async getByOrderId(orderId: string): Promise<OrderItemWithProduct[]> {
    return executeQuery<OrderItemWithProduct>(
      `SELECT oi.*, p.name as product_name, p.sku as product_sku
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?
       ORDER BY oi.created_at ASC`,
      [orderId]
    );
  },

  async create(data: Omit<OrderItem, 'id' | 'created_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [data.order_id, data.product_id, data.quantity, data.price]
    );

    const item = await getOne<{ id: string }>(
      'SELECT id FROM order_items WHERE order_id = ? AND product_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.order_id, data.product_id]
    );
    return item!.id;
  },

  async update(_id: string, _data: Partial<Omit<OrderItem, 'id' | 'order_id' | 'created_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (_data.product_id !== undefined) {
      fields.push('product_id = ? ');
      values.push(_data.product_id);
    }
    if (_data.quantity !== undefined) {
      fields.push('quantity = ? ');
      values.push(_data.quantity);
    }
    if (_data.price !== undefined) {
      fields.push('price = ? ');
      values.push(_data.price);
    }

    if (fields.length === 0) return;

    values.push(_id);
    await executeSingle(
      `UPDATE order_items SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(_id: string): Promise<void> {
    await executeSingle('DELETE FROM order_items WHERE id = ? ', [_id]);
  },

  async deleteByOrderId(orderId: string): Promise<void> {
    await executeSingle('DELETE FROM order_items WHERE order_id = ? ', [orderId]);
  }
};

// Cost Category model
export const CostCategoryModel = {
  async getAll(): Promise<CostCategory[]> {
    return executeQuery<CostCategory>(
      'SELECT * FROM cost_categories WHERE is_active = TRUE ORDER BY name ASC'
    );
  },

  async getAllIncludingInactive(): Promise<CostCategory[]> {
    return executeQuery<CostCategory>(
      'SELECT * FROM cost_categories ORDER BY is_active DESC, name ASC'
    );
  },

  async getById(_id: string): Promise<CostCategory | null> {
    return getOne<CostCategory>('SELECT * FROM cost_categories WHERE id = ?', [_id]);
  },

  async create(data: Omit<CostCategory, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO cost_categories (name, description, is_active) VALUES (?, ?, ?)',
      [data.name, data.description || null, data.is_active]
    );

    const category = await getOne<{ id: string }>(
      'SELECT id FROM cost_categories WHERE name = ? ORDER BY created_at DESC LIMIT 1',
      [data.name]
    );
    return category!.id;
  },

  async update(_id: string, _data: Partial<Omit<CostCategory, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (_data.name !== undefined) {
      fields.push('name = ?');
      values.push(_data.name);
    }
    if (_data.description !== undefined) {
      fields.push('description = ?');
      values.push(_data.description);
    }
    if (_data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(_data.is_active);
    }

    if (fields.length === 0) return;

    values.push(_id);
    await executeSingle(
      `UPDATE cost_categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(_id: string): Promise<void> {
    await executeSingle('DELETE FROM cost_categories WHERE id = ?', [_id]);
  },

  async getUsageStats(): Promise<Array<{ id: string; name: string; usage_count: number }>> {
    return executeQuery<{ id: string; name: string; usage_count: number }>(
      `SELECT cc.id, cc.name, COUNT(ci.id) as usage_count
       FROM cost_categories cc
       LEFT JOIN cost_items ci ON cc.id = ci.category_id
       GROUP BY cc.id, cc.name
       ORDER BY cc.name ASC`
    );
  }
};

// Cost Item model
export const CostItemModel = {
  async getByOrderId(orderId: string): Promise<CostItemWithCategory[]> {
    return executeQuery<CostItemWithCategory>(
      `SELECT ci.*, cc.name as category_name
       FROM cost_items ci
       LEFT JOIN cost_categories cc ON ci.category_id = cc.id
       WHERE ci.order_id = ?
       ORDER BY ci.created_at ASC`,
      [orderId]
    );
  },

  async create(data: Omit<CostItem, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO cost_items (order_id, category_id, amount) VALUES (?, ?, ?)',
      [data.order_id, data.category_id, data.amount]
    );

    const item = await getOne<{ id: string }>(
      'SELECT id FROM cost_items WHERE order_id = ? AND category_id = ? AND amount = ? ORDER BY created_at DESC LIMIT 1',
      [data.order_id, data.category_id, data.amount]
    );
    return item!.id;
  },

  async update(_id: string, _data: Partial<Omit<CostItem, 'id' | 'order_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (_data.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(_data.category_id);
    }
    if (_data.amount !== undefined) {
      fields.push('amount = ?');
      values.push(_data.amount);
    }

    if (fields.length === 0) return;

    values.push(_id);
    await executeSingle(
      `UPDATE cost_items SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(_id: string): Promise<void> {
    await executeSingle('DELETE FROM cost_items WHERE id = ?', [_id]);
  },

  async deleteByOrderId(orderId: string): Promise<void> {
    await executeSingle('DELETE FROM cost_items WHERE order_id = ?', [orderId]);
  }
};

// Product Cost Breakdown model
export const ProductCostBreakdownModel = {
  async getByProductId(productId: string): Promise<ProductCostBreakdownWithCategory[]> {
    return executeQuery<ProductCostBreakdownWithCategory>(
      `SELECT pcb.*, cc.name as category_name
       FROM product_cost_breakdowns pcb
       LEFT JOIN cost_categories cc ON pcb.category_id = cc.id
       WHERE pcb.product_id = ?
       ORDER BY pcb.created_at ASC`,
      [productId]
    );
  },

  async create(data: Omit<ProductCostBreakdown, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO product_cost_breakdowns (product_id, category_id, calculation_type, value) VALUES (?, ?, ?, ?)',
      [data.product_id, data.category_id, data.calculation_type, data.value]
    );

    const breakdown = await getOne<{ id: string }>(
      'SELECT id FROM product_cost_breakdowns WHERE product_id = ? AND category_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.product_id, data.category_id]
    );
    return breakdown!.id;
  },

  async update(id: string, data: Partial<Omit<ProductCostBreakdown, 'id' | 'product_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(data.category_id);
    }
    if (data.calculation_type !== undefined) {
      fields.push('calculation_type = ?');
      values.push(data.calculation_type);
    }
    if (data.value !== undefined) {
      fields.push('value = ?');
      values.push(data.value);
    }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE product_cost_breakdowns SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM product_cost_breakdowns WHERE id = ?', [id]);
  },

  async deleteByProductId(productId: string): Promise<void> {
    await executeSingle('DELETE FROM product_cost_breakdowns WHERE product_id = ?', [productId]);
  },

  async calculateCostItems(productId: string, quantity: number, unitPrice: number): Promise<Array<{category_id: string, amount: number}>> {
    const breakdowns = await this.getByProductId(productId);
    const costItems = [];

    for (const breakdown of breakdowns) {
      let amount = 0;
      if (breakdown.calculation_type === 'percentage') {
        // Calculate percentage of total line item value (quantity * unit price)
        amount = (unitPrice * quantity * breakdown.value) / 100;
      } else {
        // Fixed amount per unit, multiplied by quantity
        amount = breakdown.value * quantity;
      }

      costItems.push({
        category_id: breakdown.category_id,
        amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
      });
    }

    return costItems;
  }
};

// Inventory model
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

export const InventoryModel = {
  async getAll(limit = 50, offset = 0, warehouseId?: string, search?: string): Promise<InventoryWithDetails[]> {
    let query = `SELECT i.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name
                 FROM inventory i
                 LEFT JOIN products p ON i.product_id = p.id
                 LEFT JOIN warehouses w ON i.warehouse_id = w.id
                 WHERE 1=1`;
    const params: unknown[] = [];

    if (warehouseId) {
      query += ' AND i.warehouse_id = ?';
      params.push(warehouseId);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY i.updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return executeQuery<InventoryWithDetails>(query, params);
  },

  async getCount(warehouseId?: string, search?: string): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM inventory i
                 LEFT JOIN products p ON i.product_id = p.id
                 LEFT JOIN warehouses w ON i.warehouse_id = w.id
                 WHERE 1=1`;
    const params: unknown[] = [];

    if (warehouseId) {
      query += ' AND i.warehouse_id = ?';
      params.push(warehouseId);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const result = await getOne<{ count: number }>(query, params);
    return result?.count || 0;
  },

  async getById(_id: string): Promise<InventoryWithDetails | null> {
    return getOne<InventoryWithDetails>(
      `SELECT i.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name
       FROM inventory i
       LEFT JOIN products p ON i.product_id = p.id
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.id = ?`,
      [_id]
    );
  },

  async getByProductAndWarehouse(productId: string, warehouseId: string): Promise<Inventory | null> {
    return getOne<Inventory>(
      'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ?',
      [productId, warehouseId]
    );
  },

  async getByProductId(productId: string): Promise<Inventory[]> {
    return executeQuery<Inventory>(
      'SELECT * FROM inventory WHERE product_id = ?',
      [productId]
    );
  },

  async create(data: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO inventory (product_id, warehouse_id, quantity, min_quantity) VALUES (?, ?, ?, ?)',
      [data.product_id, data.warehouse_id, data.quantity, data.min_quantity]
    );

    const inventory = await getOne<{ id: string }>(
      'SELECT id FROM inventory WHERE product_id = ? AND warehouse_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.product_id, data.warehouse_id]
    );
    return inventory!.id;
  },

  async update(_id: string, _data: Partial<Omit<Inventory, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (_data.quantity !== undefined) {
      fields.push('quantity = ? ');
      values.push(_data.quantity);
    }
    if (_data.min_quantity !== undefined) {
      fields.push('min_quantity = ? ');
      values.push(_data.min_quantity);
    }

    if (fields.length === 0) return;

    values.push(_id);
    await executeSingle(
      `UPDATE inventory SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(_id: string): Promise<void> {
    await executeSingle('DELETE FROM inventory WHERE id = ? ', [_id]);
  },

  async getLowStock(limit = 10): Promise<InventoryWithDetails[]> {
    return executeQuery<InventoryWithDetails>(
      `SELECT i.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name
       FROM inventory i
       LEFT JOIN products p ON i.product_id = p.id
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.quantity <= i.min_quantity
       ORDER BY i.updated_at DESC LIMIT ?`,
      [limit]
    );
  },

  async adjustQuantity(_id: string, adjustment: number, _reason?: string): Promise<void> {
    await executeSingle(
      'UPDATE inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? ',
      [adjustment, _id]
    );
  }
};

// Warehouse model
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

export const WarehouseModel = {
  async getAll(): Promise<Warehouse[]> {
    return executeQuery<Warehouse>('SELECT * FROM warehouses ORDER BY name');
  },

  async getById(_id: string): Promise<Warehouse | null> {
    return getOne<Warehouse>('SELECT * FROM warehouses WHERE id = ?', [_id]);
  },

  async create(_data: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO warehouses (name, address, city, state, zip) VALUES (?, ?, ?, ?, ?)',
      [_data.name, _data.address || null, _data.city || null, _data.state || null, _data.zip || null]
    );

    const warehouse = await getOne<{ id: string }>(
      'SELECT id FROM warehouses WHERE name = ? ORDER BY created_at DESC LIMIT 1',
      [_data.name]
    );
    return warehouse!.id;
  },

  async update(_id: string, _data: Partial<Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (_data.name !== undefined) {
      fields.push('name = ? ');
      values.push(_data.name);
    }
    if (_data.address !== undefined) {
      fields.push('address = ? ');
      values.push(_data.address);
    }
    if (_data.city !== undefined) {
      fields.push('city = ? ');
      values.push(_data.city);
    }
    if (_data.state !== undefined) {
      fields.push('state = ?');
      values.push(_data.state);
    }
    if (_data.zip !== undefined) {
      fields.push('zip = ? ');
      values.push(_data.zip);
    }

    if (fields.length === 0) return;

    values.push(_id);
    await executeSingle(
      `UPDATE warehouses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(_id: string): Promise<void> {
    await executeSingle('DELETE FROM warehouses WHERE id = ?', [_id]);
  }
};

// Role model
export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const RoleModel = {
  async getByName(name: string): Promise<Role | null> {
    return getOne<Role>('SELECT * FROM roles WHERE name = ? ', [name]);
  }
};

// Content Type model
export interface ContentType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

// Affiliate Code model
export interface AffiliateCode {
  id: string;
  code: string;
  name?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  is_active: boolean;
  expires_at?: string;
  usage_limit?: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Site Settings model
export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const SiteSettingsModel = {
  async getAll(): Promise<SiteSetting[]> {
    return executeQuery<SiteSetting>('SELECT * FROM site_settings ORDER BY setting_key');
  },

  async getPublic(): Promise<SiteSetting[]> {
    return executeQuery<SiteSetting>('SELECT * FROM site_settings WHERE is_public = TRUE ORDER BY setting_key');
  },

  async getByKey(key: string): Promise<SiteSetting | null> {
    return getOne<SiteSetting>('SELECT * FROM site_settings WHERE setting_key = ?', [key]);
  },

  async getValue(key: string): Promise<string | null> {
    const setting = await getOne<{ setting_value: string | null }>(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      [key]
    );
    return setting?.setting_value || null;
  },

  async setValue(key: string, value: string | null): Promise<void> {
    const existing = await this.getByKey(key);
    if (existing) {
      await executeSingle(
        'UPDATE site_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
        [value, key]
      );
    } else {
      await executeSingle(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)',
        [key, value]
      );
    }
  },

  async create(data: Omit<SiteSetting, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO site_settings (setting_key, setting_value, setting_type, description, is_public) VALUES (?, ?, ?, ?, ?)',
      [data.setting_key, data.setting_value || null, data.setting_type, data.description || null, data.is_public]
    );

    const setting = await getOne<{ id: string }>(
      'SELECT id FROM site_settings WHERE setting_key = ? ORDER BY created_at DESC LIMIT 1',
      [data.setting_key]
    );
    return setting!.id;
  },

  async update(key: string, data: Partial<Omit<SiteSetting, 'id' | 'setting_key' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.setting_value !== undefined) {
      fields.push('setting_value = ?');
      values.push(data.setting_value);
    }
    if (data.setting_type !== undefined) {
      fields.push('setting_type = ?');
      values.push(data.setting_type);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.is_public !== undefined) {
      fields.push('is_public = ?');
      values.push(data.is_public);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(key);
      await executeSingle(
        `UPDATE site_settings SET ${fields.join(', ')} WHERE setting_key = ?`,
        values
      );
    }
  },

  async delete(key: string): Promise<void> {
    await executeSingle('DELETE FROM site_settings WHERE setting_key = ?', [key]);
  }
};

export const AffiliateCodeModel = {
  async getAll(limit = 50, offset = 0): Promise<AffiliateCode[]> {
    return executeQuery<AffiliateCode>(
      'SELECT * FROM affiliate_codes ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  },

  async getById(id: string): Promise<AffiliateCode | null> {
    return getOne<AffiliateCode>('SELECT * FROM affiliate_codes WHERE id = ?', [id]);
  },

  async getByCode(code: string): Promise<AffiliateCode | null> {
    return getOne<AffiliateCode>('SELECT * FROM affiliate_codes WHERE code = ?', [code]);
  },

  async validateCode(code: string): Promise<{ valid: boolean; affiliateCode?: AffiliateCode; reason?: string }> {
    const affiliateCode = await this.getByCode(code);

    if (!affiliateCode) {
      return { valid: false, reason: 'Affiliate code not found' };
    }

    if (!affiliateCode.is_active) {
      return { valid: false, reason: 'Affiliate code is inactive' };
    }

    // Check expiration
    if (affiliateCode.expires_at) {
      const expiryDate = new Date(affiliateCode.expires_at);
      if (expiryDate < new Date()) {
        return { valid: false, reason: 'Affiliate code has expired' };
      }
    }

    // Check usage limit
    if (affiliateCode.usage_limit && affiliateCode.usage_count >= affiliateCode.usage_limit) {
      return { valid: false, reason: 'Affiliate code usage limit reached' };
    }

    return { valid: true, affiliateCode };
  },

  async incrementUsage(id: string): Promise<void> {
    await executeSingle(
      'UPDATE affiliate_codes SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
  },

  async create(data: Omit<AffiliateCode, 'id' | 'usage_count' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO affiliate_codes (code, name, discount_type, discount_value, is_active, expires_at, usage_limit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.code, data.name || null, data.discount_type, data.discount_value, data.is_active, data.expires_at || null, data.usage_limit || null]
    );

    const affiliateCode = await getOne<{ id: string }>(
      'SELECT id FROM affiliate_codes WHERE code = ? ORDER BY created_at DESC LIMIT 1',
      [data.code]
    );
    return affiliateCode!.id;
  },

  async update(id: string, data: Partial<Omit<AffiliateCode, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.code !== undefined) {
      fields.push('code = ?');
      values.push(data.code);
    }
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.discount_type !== undefined) {
      fields.push('discount_type = ?');
      values.push(data.discount_type);
    }
    if (data.discount_value !== undefined) {
      fields.push('discount_value = ?');
      values.push(data.discount_value);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }
    if (data.expires_at !== undefined) {
      fields.push('expires_at = ?');
      values.push(data.expires_at);
    }
    if (data.usage_limit !== undefined) {
      fields.push('usage_limit = ?');
      values.push(data.usage_limit);
    }
    if (data.usage_count !== undefined) {
      fields.push('usage_count = ?');
      values.push(data.usage_count);
    }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE affiliate_codes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM affiliate_codes WHERE id = ?', [id]);
  },

  calculateDiscount(price: number, affiliateCode: AffiliateCode): number {
    if (affiliateCode.discount_type === 'percentage') {
      return Math.round((price * affiliateCode.discount_value / 100) * 100) / 100;
    } else {
      return Math.min(affiliateCode.discount_value, price); // Don't discount more than the price
    }
  },

  applyDiscount(price: number, affiliateCode: AffiliateCode): number {
    const discount = this.calculateDiscount(price, affiliateCode);
    return Math.max(0, price - discount); // Ensure price doesn't go below 0
  }
};

export const ContentTypeModel = {
  async getAll(): Promise<ContentType[]> {
    return executeQuery<ContentType>('SELECT * FROM content_types ORDER BY name');
  },

  async getById(id: string): Promise<ContentType | null> {
    return getOne<ContentType>('SELECT * FROM content_types WHERE id = ?', [id]);
  },

  async getByName(name: string): Promise<ContentType | null> {
    return getOne<ContentType>('SELECT * FROM content_types WHERE name = ?', [name]);
  }
};

// Content model
export interface Content {
  id: string;
  title: string;
  slug: string;
  content?: string;
  type_id: string;
  published: boolean;
  author_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentWithDetails extends Content {
  type_name?: string;
  author_name?: string;
}

export const ContentModel = {
  async getAll(limit = 50, offset = 0): Promise<ContentWithDetails[]> {
    return executeQuery<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(p.first_name, ' ', p.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN profiles p ON c.author_id = p.id
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async getByType(typeId: string, limit = 50, offset = 0): Promise<ContentWithDetails[]> {
    return executeQuery<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(p.first_name, ' ', p.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN profiles p ON c.author_id = p.id
       WHERE c.type_id = ?
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [typeId, limit, offset]
    );
  },

  async getPublished(limit = 50, offset = 0): Promise<ContentWithDetails[]> {
    return executeQuery<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(p.first_name, ' ', p.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN profiles p ON c.author_id = p.id
       WHERE c.published = TRUE
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async getPublishedByType(typeId: string, limit = 50, offset = 0): Promise<ContentWithDetails[]> {
    return executeQuery<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(p.first_name, ' ', p.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN profiles p ON c.author_id = p.id
       WHERE c.published = TRUE AND c.type_id = ?
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [typeId, limit, offset]
    );
  },

  async getById(id: string): Promise<ContentWithDetails | null> {
    return getOne<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(p.first_name, ' ', p.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN profiles p ON c.author_id = p.id
       WHERE c.id = ?`,
      [id]
    );
  },

  async getBySlug(slug: string): Promise<ContentWithDetails | null> {
    return getOne<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(p.first_name, ' ', p.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN profiles p ON c.author_id = p.id
       WHERE c.slug = ?`,
      [slug]
    );
  },

  async search(query: string, limit = 50, offset = 0): Promise<ContentWithDetails[]> {
    const searchTerm = `%${query}%`;
    return executeQuery<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(p.first_name, ' ', p.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN profiles p ON c.author_id = p.id
       WHERE c.title LIKE ? OR c.content LIKE ?
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, limit, offset]
    );
  },

  async create(data: Omit<Content, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO content (title, slug, content, type_id, published, author_id) VALUES (?, ?, ?, ?, ?, ?)',
      [data.title, data.slug, data.content || null, data.type_id, data.published, data.author_id || null]
    );

    const content = await getOne<{ id: string }>(
      'SELECT id FROM content WHERE slug = ? ORDER BY created_at DESC LIMIT 1',
      [data.slug]
    );
    return content!.id;
  },

  async update(id: string, data: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.slug !== undefined) {
      fields.push('slug = ?');
      values.push(data.slug);
    }
    if (data.content !== undefined) {
      fields.push('content = ?');
      values.push(data.content || null);
    }
    if (data.type_id !== undefined) {
      fields.push('type_id = ?');
      values.push(data.type_id);
    }
    if (data.published !== undefined) {
      fields.push('published = ?');
      values.push(data.published);
    }
    if (data.author_id !== undefined) {
      fields.push('author_id = ?');
      values.push(data.author_id || null);
    }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE content SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM content WHERE id = ?', [id]);
  },

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM content');
    return result?.count || 0;
  },

  async getCountByType(typeId: string): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM content WHERE type_id = ?', [typeId]);
    return result?.count || 0;
  },

  async getPublishedCountByType(typeId: string): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM content WHERE published = TRUE AND type_id = ?', [typeId]);
    return result?.count || 0;
  },

  async getPublishedCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM content WHERE published = TRUE');
    return result?.count || 0;
  }
};

// Listing Platform Model
// Platform Credentials Model
export const PlatformCredentialsModel = {
  async getByUserAndPlatform(userId: string, platformId: string): Promise<PlatformCredentials | null> {
    const result = await getOne<PlatformCredentials>(
      'SELECT * FROM platform_credentials WHERE user_id = ? AND platform_id = ? AND is_active = TRUE',
      [userId, platformId]
    );

    if (result) {
      console.log('Raw credentials from DB:', typeof result.credentials, result.credentials);

      // If credentials is a string, parse it
      if (typeof result.credentials === 'string') {
        try {
          result.credentials = JSON.parse(result.credentials);
          console.log('Parsed credentials:', result.credentials);
        } catch (e) {
          console.error('Failed to parse credentials JSON:', e);
        }
      }
    }

    return result;
  },

  async create(data: Omit<PlatformCredentials, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO platform_credentials (platform_id, user_id, credential_type, credentials, is_active, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [data.platform_id, data.user_id, data.credential_type, JSON.stringify(data.credentials), data.is_active, data.expires_at || null]
    );

    const credential = await getOne<{ id: string }>(
      'SELECT id FROM platform_credentials WHERE user_id = ? AND platform_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.user_id, data.platform_id]
    );
    return credential!.id;
  },

  async update(userId: string, platformId: string, data: Partial<Omit<PlatformCredentials, 'id' | 'user_id' | 'platform_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.credential_type !== undefined) {
      fields.push('credential_type = ?');
      values.push(data.credential_type);
    }
    if (data.credentials !== undefined) {
      fields.push('credentials = ?');
      values.push(JSON.stringify(data.credentials));
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }
    if (data.expires_at !== undefined) {
      fields.push('expires_at = ?');
      values.push(data.expires_at || null);
    }

    if (fields.length > 0) {
      values.push(userId, platformId);
      await executeSingle(
        `UPDATE platform_credentials SET ${fields.join(', ')} WHERE user_id = ? AND platform_id = ?`,
        values
      );
    }
  },

  async upsert(data: Omit<PlatformCredentials, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const existing = await this.getByUserAndPlatform(data.user_id, data.platform_id);
    if (existing) {
      await this.update(data.user_id, data.platform_id, {
        credential_type: data.credential_type,
        credentials: data.credentials,
        is_active: data.is_active,
        expires_at: data.expires_at
      });
    } else {
      await this.create(data);
    }
  },

  async delete(userId: string, platformId: string): Promise<void> {
    await executeSingle('DELETE FROM platform_credentials WHERE user_id = ? AND platform_id = ?', [userId, platformId]);
  }
};

export const ListingPlatformModel = {
  async getAll(): Promise<ListingPlatform[]> {
    return executeQuery<ListingPlatform>(
      'SELECT * FROM listing_platforms ORDER BY display_name ASC',
      []
    );
  },

  async getActive(): Promise<ListingPlatform[]> {
    return executeQuery<ListingPlatform>(
      'SELECT * FROM listing_platforms WHERE is_active = TRUE ORDER BY display_name ASC',
      []
    );
  },

  async getById(id: string): Promise<ListingPlatform | null> {
    return getOne<ListingPlatform>('SELECT * FROM listing_platforms WHERE id = ?', [id]);
  },

  async getByName(name: string): Promise<ListingPlatform | null> {
    return getOne<ListingPlatform>('SELECT * FROM listing_platforms WHERE name = ?', [name]);
  },

  async create(data: Omit<ListingPlatform, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO listing_platforms (name, display_name, api_endpoint, requires_auth, is_active, configuration) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.display_name, data.api_endpoint || null, data.requires_auth, data.is_active, JSON.stringify(data.configuration)]
    );

    const platform = await getOne<{ id: string }>(
      'SELECT id FROM listing_platforms WHERE name = ? ORDER BY created_at DESC LIMIT 1',
      [data.name]
    );
    return platform!.id;
  },

  async update(id: string, data: Partial<Omit<ListingPlatform, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.display_name !== undefined) {
      fields.push('display_name = ?');
      values.push(data.display_name);
    }
    if (data.api_endpoint !== undefined) {
      fields.push('api_endpoint = ?');
      values.push(data.api_endpoint || null);
    }
    if (data.requires_auth !== undefined) {
      fields.push('requires_auth = ?');
      values.push(data.requires_auth);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }
    if (data.configuration !== undefined) {
      fields.push('configuration = ?');
      values.push(typeof data.configuration === 'string' ? data.configuration : JSON.stringify(data.configuration));
    }

    if (fields.length > 0) {
      values.push(id);
      await executeSingle(
        `UPDATE listing_platforms SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM listing_platforms WHERE id = ?', [id]);
  }
};

// Listing Template Model
export const ListingTemplateModel = {
  async getAll(): Promise<ListingTemplateWithPlatform[]> {
    return executeQuery<ListingTemplateWithPlatform>(
      `SELECT lt.*, lp.name as platform_name, lp.display_name as platform_display_name
       FROM listing_templates lt
       LEFT JOIN listing_platforms lp ON lt.platform_id = lp.id
       ORDER BY lp.display_name ASC, lt.name ASC`,
      []
    );
  },

  async getByPlatformId(platformId: string): Promise<ListingTemplateWithPlatform[]> {
    return executeQuery<ListingTemplateWithPlatform>(
      `SELECT lt.*, lp.name as platform_name, lp.display_name as platform_display_name
       FROM listing_templates lt
       LEFT JOIN listing_platforms lp ON lt.platform_id = lp.id
       WHERE lt.platform_id = ? AND lt.is_active = TRUE
       ORDER BY lt.is_default DESC, lt.name ASC`,
      [platformId]
    );
  },

  async getById(id: string): Promise<ListingTemplateWithPlatform | null> {
    return getOne<ListingTemplateWithPlatform>(
      `SELECT lt.*, lp.name as platform_name, lp.display_name as platform_display_name
       FROM listing_templates lt
       LEFT JOIN listing_platforms lp ON lt.platform_id = lp.id
       WHERE lt.id = ?`,
      [id]
    );
  },

  async getDefaultByPlatformId(platformId: string): Promise<ListingTemplateWithPlatform | null> {
    return getOne<ListingTemplateWithPlatform>(
      `SELECT lt.*, lp.name as platform_name, lp.display_name as platform_display_name
       FROM listing_templates lt
       LEFT JOIN listing_platforms lp ON lt.platform_id = lp.id
       WHERE lt.platform_id = ? AND lt.is_default = TRUE AND lt.is_active = TRUE`,
      [platformId]
    );
  },

  async create(data: Omit<ListingTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO listing_templates (platform_id, name, title_template, description_template, category_mapping, price_adjustment_type, price_adjustment_value, shipping_template, is_default, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.platform_id,
        data.name,
        data.title_template || null,
        data.description_template || null,
        JSON.stringify(data.category_mapping),
        data.price_adjustment_type,
        data.price_adjustment_value,
        data.shipping_template ? JSON.stringify(data.shipping_template) : null,
        data.is_default,
        data.is_active
      ]
    );

    const template = await getOne<{ id: string }>(
      'SELECT id FROM listing_templates WHERE platform_id = ? AND name = ? ORDER BY created_at DESC LIMIT 1',
      [data.platform_id, data.name]
    );
    return template!.id;
  },

  async update(id: string, data: Partial<Omit<ListingTemplate, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.title_template !== undefined) {
      fields.push('title_template = ?');
      values.push(data.title_template || null);
    }
    if (data.description_template !== undefined) {
      fields.push('description_template = ?');
      values.push(data.description_template || null);
    }
    if (data.category_mapping !== undefined) {
      fields.push('category_mapping = ?');
      values.push(JSON.stringify(data.category_mapping));
    }
    if (data.price_adjustment_type !== undefined) {
      fields.push('price_adjustment_type = ?');
      values.push(data.price_adjustment_type);
    }
    if (data.price_adjustment_value !== undefined) {
      fields.push('price_adjustment_value = ?');
      values.push(data.price_adjustment_value);
    }
    if (data.shipping_template !== undefined) {
      fields.push('shipping_template = ?');
      values.push(data.shipping_template ? JSON.stringify(data.shipping_template) : null);
    }
    if (data.is_default !== undefined) {
      fields.push('is_default = ?');
      values.push(data.is_default);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }

    if (fields.length > 0) {
      values.push(id);
      await executeSingle(
        `UPDATE listing_templates SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM listing_templates WHERE id = ?', [id]);
  }
};

// Product Listing Model
export const ProductListingModel = {
  async getAll(limit = 50, offset = 0): Promise<ProductListingWithDetails[]> {
    return executeQuery<ProductListingWithDetails>(
      `SELECT pl.*, p.name as product_name, p.sku as product_sku,
              lp.name as platform_name, lp.display_name as platform_display_name,
              lt.name as template_name
       FROM product_listings pl
       LEFT JOIN products p ON pl.product_id = p.id
       LEFT JOIN listing_platforms lp ON pl.platform_id = lp.id
       LEFT JOIN listing_templates lt ON pl.template_id = lt.id
       ORDER BY pl.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async getByProductId(productId: string): Promise<ProductListingWithDetails[]> {
    return executeQuery<ProductListingWithDetails>(
      `SELECT pl.*, p.name as product_name, p.sku as product_sku,
              lp.name as platform_name, lp.display_name as platform_display_name,
              lt.name as template_name
       FROM product_listings pl
       LEFT JOIN products p ON pl.product_id = p.id
       LEFT JOIN listing_platforms lp ON pl.platform_id = lp.id
       LEFT JOIN listing_templates lt ON pl.template_id = lt.id
       WHERE pl.product_id = ?
       ORDER BY lp.display_name ASC`,
      [productId]
    );
  },

  async getByPlatformId(platformId: string): Promise<ProductListingWithDetails[]> {
    return executeQuery<ProductListingWithDetails>(
      `SELECT pl.*, p.name as product_name, p.sku as product_sku,
              lp.name as platform_name, lp.display_name as platform_display_name,
              lt.name as template_name
       FROM product_listings pl
       LEFT JOIN products p ON pl.product_id = p.id
       LEFT JOIN listing_platforms lp ON pl.platform_id = lp.id
       LEFT JOIN listing_templates lt ON pl.template_id = lt.id
       WHERE pl.platform_id = ?
       ORDER BY pl.created_at DESC`,
      [platformId]
    );
  },

  async getById(id: string): Promise<ProductListingWithDetails | null> {
    return getOne<ProductListingWithDetails>(
      `SELECT pl.*, p.name as product_name, p.sku as product_sku,
              lp.name as platform_name, lp.display_name as platform_display_name,
              lt.name as template_name
       FROM product_listings pl
       LEFT JOIN products p ON pl.product_id = p.id
       LEFT JOIN listing_platforms lp ON pl.platform_id = lp.id
       LEFT JOIN listing_templates lt ON pl.template_id = lt.id
       WHERE pl.id = ?`,
      [id]
    );
  },

  async getByProductAndPlatform(productId: string, platformId: string): Promise<ProductListingWithDetails | null> {
    return getOne<ProductListingWithDetails>(
      `SELECT pl.*, p.name as product_name, p.sku as product_sku,
              lp.name as platform_name, lp.display_name as platform_display_name,
              lt.name as template_name
       FROM product_listings pl
       LEFT JOIN products p ON pl.product_id = p.id
       LEFT JOIN listing_platforms lp ON pl.platform_id = lp.id
       LEFT JOIN listing_templates lt ON pl.template_id = lt.id
       WHERE pl.product_id = ? AND pl.platform_id = ?`,
      [productId, platformId]
    );
  },

  async create(data: Omit<ProductListing, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO product_listings (product_id, platform_id, template_id, external_listing_id, title, description, price, status, listing_url, error_message, auto_sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.product_id,
        data.platform_id,
        data.template_id || null,
        data.external_listing_id || null,
        data.title || null,
        data.description || null,
        data.price || null,
        data.status,
        data.listing_url || null,
        data.error_message || null,
        data.auto_sync
      ]
    );

    const listing = await getOne<{ id: string }>(
      'SELECT id FROM product_listings WHERE product_id = ? AND platform_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.product_id, data.platform_id]
    );
    return listing!.id;
  },

  async update(id: string, data: Partial<Omit<ProductListing, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.template_id !== undefined) {
      fields.push('template_id = ?');
      values.push(data.template_id || null);
    }
    if (data.external_listing_id !== undefined) {
      fields.push('external_listing_id = ?');
      values.push(data.external_listing_id || null);
    }
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title || null);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description || null);
    }
    if (data.price !== undefined) {
      fields.push('price = ?');
      values.push(data.price || null);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.listing_url !== undefined) {
      fields.push('listing_url = ?');
      values.push(data.listing_url || null);
    }
    if (data.error_message !== undefined) {
      fields.push('error_message = ?');
      values.push(data.error_message || null);
    }
    if (data.auto_sync !== undefined) {
      fields.push('auto_sync = ?');
      values.push(data.auto_sync);
    }

    // Always update last_sync_at when updating
    fields.push('last_sync_at = CURRENT_TIMESTAMP');

    if (fields.length > 0) {
      values.push(id);
      await executeSingle(
        `UPDATE product_listings SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM product_listings WHERE id = ?', [id]);
  },

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM product_listings');
    return result?.count || 0;
  },

  async getCountByStatus(status: string): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM product_listings WHERE status = ?', [status]);
    return result?.count || 0;
  }
};

// Email Communication Model
export const EmailCommunicationModel = {
  async getByContactId(contactId: string, limit = 50, offset = 0): Promise<EmailCommunication[]> {
    return executeQuery<EmailCommunication>(
      'SELECT * FROM email_communications WHERE contact_id = ? ORDER BY sent_at DESC LIMIT ? OFFSET ?',
      [contactId, limit, offset]
    );
  },

  async getById(id: string): Promise<EmailCommunication | null> {
    return getOne<EmailCommunication>('SELECT * FROM email_communications WHERE id = ?', [id]);
  },

  async create(data: Omit<EmailCommunication, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO email_communications (contact_id, direction, from_email, to_email, cc_emails, bcc_emails, subject, body_text, body_html, message_id, thread_id, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.contact_id,
        data.direction,
        data.from_email,
        data.to_email,
        data.cc_emails ? JSON.stringify(data.cc_emails) : null,
        data.bcc_emails ? JSON.stringify(data.bcc_emails) : null,
        data.subject || null,
        data.body_text || null,
        data.body_html || null,
        data.message_id || null,
        data.thread_id || null,
        data.status,
        data.sent_at
      ]
    );

    const email = await getOne<{ id: string }>(
      'SELECT id FROM email_communications WHERE contact_id = ? AND sent_at = ? ORDER BY created_at DESC LIMIT 1',
      [data.contact_id, data.sent_at]
    );
    return email!.id;
  },

  async updateStatus(id: string, status: EmailCommunication['status']): Promise<void> {
    await executeSingle(
      'UPDATE email_communications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
  }
};

// SMS Communication Model
export const SMSCommunicationModel = {
  async getByContactId(contactId: string, limit = 50, offset = 0): Promise<SMSCommunication[]> {
    return executeQuery<SMSCommunication>(
      'SELECT * FROM sms_communications WHERE contact_id = ? ORDER BY sent_at DESC LIMIT ? OFFSET ?',
      [contactId, limit, offset]
    );
  },

  async getById(id: string): Promise<SMSCommunication | null> {
    return getOne<SMSCommunication>('SELECT * FROM sms_communications WHERE id = ?', [id]);
  },

  async create(data: Omit<SMSCommunication, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO sms_communications (contact_id, direction, from_phone, to_phone, message_text, status, provider, provider_message_id, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.contact_id,
        data.direction,
        data.from_phone,
        data.to_phone,
        data.message_text,
        data.status,
        data.provider || null,
        data.provider_message_id || null,
        data.sent_at
      ]
    );

    const sms = await getOne<{ id: string }>(
      'SELECT id FROM sms_communications WHERE contact_id = ? AND sent_at = ? ORDER BY created_at DESC LIMIT 1',
      [data.contact_id, data.sent_at]
    );
    return sms!.id;
  },

  async updateStatus(id: string, status: SMSCommunication['status']): Promise<void> {
    await executeSingle(
      'UPDATE sms_communications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
  }
};

// Communication History Model - combines all communication types
export const CommunicationHistoryModel = {
  async getByContactId(contactId: string, limit = 50, offset = 0): Promise<CommunicationHistoryItem[]> {
    // Get Facebook messages
    const facebookMessages = await executeQuery<any>(
      `SELECT
        fm.id,
        'facebook' as type,
        fc.contact_id,
        CASE WHEN fm.is_from_page = 1 THEN 'outbound' ELSE 'inbound' END as direction,
        fm.message_text as content,
        NULL as subject,
        FROM_UNIXTIME(fm.timestamp / 1000) as timestamp,
        NULL as status,
        JSON_OBJECT(
          'facebook_message_id', fm.facebook_message_id,
          'message_type', fm.message_type,
          'attachments', fm.attachments,
          'conversation_id', fm.conversation_id
        ) as metadata
       FROM facebook_messages fm
       JOIN facebook_conversations fc ON fm.conversation_id = fc.id
       WHERE fc.contact_id = ?`,
      [contactId]
    );

    // Get email communications
    const emails = await executeQuery<any>(
      `SELECT
        id,
        'email' as type,
        contact_id,
        direction,
        COALESCE(body_text, body_html, '') as content,
        subject,
        sent_at as timestamp,
        status,
        JSON_OBJECT(
          'from_email', from_email,
          'to_email', to_email,
          'cc_emails', cc_emails,
          'bcc_emails', bcc_emails,
          'message_id', message_id,
          'thread_id', thread_id
        ) as metadata
       FROM email_communications
       WHERE contact_id = ?`,
      [contactId]
    );

    // Get SMS communications
    const smsMessages = await executeQuery<any>(
      `SELECT
        id,
        'sms' as type,
        contact_id,
        direction,
        message_text as content,
        NULL as subject,
        sent_at as timestamp,
        status,
        JSON_OBJECT(
          'from_phone', from_phone,
          'to_phone', to_phone,
          'provider', provider,
          'provider_message_id', provider_message_id
        ) as metadata
       FROM sms_communications
       WHERE contact_id = ?`,
      [contactId]
    );

    // Combine all communications and sort by timestamp
    const allCommunications = [
      ...facebookMessages,
      ...emails,
      ...smsMessages
    ];

    // Sort by timestamp descending (newest first)
    allCommunications.sort((a, b) => {
      const timestampA = new Date(a.timestamp).getTime();
      const timestampB = new Date(b.timestamp).getTime();
      return timestampB - timestampA;
    });

    // Apply pagination
    const paginatedResults = allCommunications.slice(offset, offset + limit);

    // Parse metadata JSON strings back to objects
    return paginatedResults.map(item => ({
      ...item,
      metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata
    }));
  },

  async getCount(contactId: string): Promise<number> {
    // Count Facebook messages
    const facebookCount = await getOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM facebook_messages fm
       JOIN facebook_conversations fc ON fm.conversation_id = fc.id
       WHERE fc.contact_id = ?`,
      [contactId]
    );

    // Count email communications
    const emailCount = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM email_communications WHERE contact_id = ?',
      [contactId]
    );

    // Count SMS communications
    const smsCount = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM sms_communications WHERE contact_id = ?',
      [contactId]
    );

    return (facebookCount?.count || 0) + (emailCount?.count || 0) + (smsCount?.count || 0);
  }
};
