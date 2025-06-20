import {getOne, executeSingle, executeQuery} from '../mysql/connection';

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
  created_at: string;
  updated_at: string;
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

  async create(data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO contacts (name, email, phone, address, city, state, zip, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.email || '', data.phone || '', data.address || '', data.city || '', data.state || '', data.zip || '', data.notes || null, data.user_id || null]
    );

    const contact = await getOne<{ id: string }>(
      'SELECT id FROM contacts WHERE name = ? AND email = ? ORDER BY created_at DESC LIMIT 1',
      [data.name, data.email || '']
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

    if (fields.length === 0) return;

    values.push(_id);
    await executeSingle(
      `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
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

  async getSearchCount(query: string): Promise<number> {
    const searchTerm = `%${query}%`;
    const result = await getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM contacts WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?',
      [searchTerm, searchTerm, searchTerm]
    );
    return result?.count || 0;
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

  async getById(_id: string): Promise<ProductCategory | null> {
    return getOne<ProductCategory>('SELECT * FROM product_categories WHERE id = ? ', [_id]);
  }
};

// Product model
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category_id?: string;
  sku: string;
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
    return getOne<Product>('SELECT * FROM products WHERE id = ?', [_id]);
  },

  async getBySku(sku: string): Promise<Product | null> {
    return getOne<Product>('SELECT * FROM products WHERE sku = ?', [sku]);
  },

  async create(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    await executeSingle(
      'INSERT INTO products (name, description, price, image_url, category_id, sku, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.description, data.price, data.image_url || null, data.category_id || null, data.sku, data.is_active]
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
    if (data.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(data.category_id);
    }
    if (data.sku !== undefined) {
      fields.push('sku = ?');
      values.push(data.sku);
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
  description?: string;
  amount: number | string;
  created_at: string;
  updated_at: string;
}

export interface CostItemWithCategory extends CostItem {
  category_name?: string;
}

// Cart item interface for frontend cart management
export interface CartItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_price: number;
  product_image_url?: string;
  quantity: number;
}

export const OrderModel = {
  async getAll(limit = 50, offset = 0): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*, c.name as contact_name
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       ORDER BY o.order_date DESC, o.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async search(query: string, limit = 50, offset = 0): Promise<OrderWithContact[]> {
    const searchTerm = `%${query}%`;
    return executeQuery<OrderWithContact>(
      `SELECT o.*, c.name as contact_name
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

  async getAllByUser(_userId: string, limit = 50, offset = 0): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*, c.name as contact_name
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE c.user_id = ?
       ORDER BY o.order_date DESC, o.created_at DESC LIMIT ? OFFSET ?`,
      [_userId, limit, offset]
    );
  },

  async getById(_id: string): Promise<Order | null> {
    return getOne<Order>('SELECT * FROM orders WHERE id = ?', [_id]);
  },

  async getByIdForUser(_id: string, _userId: string): Promise<OrderWithContact | null> {
    return getOne<OrderWithContact>(
      `SELECT o.*, c.name as contact_name
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
      `SELECT o.*, c.name as contact_name
       FROM orders o
       LEFT JOIN contacts c ON o.contact_id = c.id
       WHERE o.contact_id = ?
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

  async getOrdersByMonthAndStatus(month: string, status: string): Promise<OrderWithContact[]> {
    return executeQuery<OrderWithContact>(
      `SELECT o.*, c.name as contact_name
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
      `SELECT o.*, c.name as contact_name
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
      'INSERT INTO cost_items (order_id, category_id, description, amount) VALUES (?, ?, ?, ?)',
      [data.order_id, data.category_id, data.description || null, data.amount]
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
    if (_data.description !== undefined) {
      fields.push('description = ?');
      values.push(_data.description || null);
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
