import { executeQuery, getOne, executeSingle } from '../mysql/connection';

// Customer model
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
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

export const CustomerModel = {
  async getAll(limit = 50, offset = 0): Promise<Customer[]> {
    return executeQuery<Customer>(
      'SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  },

  async getById(id: string): Promise<Customer | null> {
    return getOne<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
  },

  async create(data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const result = await executeSingle(
      `INSERT INTO customers (id, first_name, last_name, email, phone, address, city, state, zip, notes, user_id)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.first_name, data.last_name, data.email, data.phone, data.address, data.city, data.state, data.zip, data.notes, data.user_id]
    );
    
    const customer = await getOne<{ id: string }>('SELECT id FROM customers WHERE email = ? ORDER BY created_at DESC LIMIT 1', [data.email]);
    return customer!.id;
  },

  async update(id: string, data: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.first_name !== undefined) { fields.push('first_name = ?'); values.push(data.first_name); }
    if (data.last_name !== undefined) { fields.push('last_name = ?'); values.push(data.last_name); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city); }
    if (data.state !== undefined) { fields.push('state = ?'); values.push(data.state); }
    if (data.zip !== undefined) { fields.push('zip = ?'); values.push(data.zip); }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
    if (data.user_id !== undefined) { fields.push('user_id = ?'); values.push(data.user_id); }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM customers WHERE id = ?', [id]);
  },

  async search(query: string, limit = 50, offset = 0): Promise<Customer[]> {
    const searchTerm = `%${query}%`;
    return executeQuery<Customer>(
      `SELECT * FROM customers
       WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]
    );
  },

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM customers');
    return result?.count || 0;
  },

  async getSearchCount(query: string): Promise<number> {
    const searchTerm = `%${query}%`;
    const result = await getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM customers
       WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
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

  async getById(id: string): Promise<ProductCategory | null> {
    return getOne<ProductCategory>('SELECT * FROM product_categories WHERE id = ?', [id]);
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

    const searchTerm = `%${query}%`;
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

  async getById(id: string): Promise<Product | null> {
    return getOne<Product>('SELECT * FROM products WHERE id = ?', [id]);
  },

  async getBySku(sku: string): Promise<Product | null> {
    return getOne<Product>('SELECT * FROM products WHERE sku = ?', [sku]);
  },

  async create(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const result = await executeSingle(
      `INSERT INTO products (id, name, description, price, image_url, category_id, sku, is_active)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.description, data.price, data.image_url, data.category_id, data.sku, data.is_active]
    );

    const product = await getOne<{ id: string }>('SELECT id FROM products WHERE sku = ? ORDER BY created_at DESC LIMIT 1', [data.sku]);
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

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM products WHERE id = ?', [id]);
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
      `SELECT COUNT(*) as count FROM products
       WHERE is_active = TRUE AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)`,
      [searchTerm, searchTerm, searchTerm]
    );
    return result?.count || 0;
  },

  async getByCategory(categoryId: string, limit = 50, offset = 0, sort = ''): Promise<ProductWithFirstImage[]> {
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
      [categoryId, limit, offset]
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
    const result = await executeSingle(
      `INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [data.product_id, data.image_url, data.alt_text, data.sort_order]
    );

    const image = await getOne<{ id: string }>(
      'SELECT id FROM product_images WHERE product_id = ? AND image_url = ? ORDER BY created_at DESC LIMIT 1',
      [data.product_id, data.image_url]
    );
    return image!.id;
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM product_images WHERE id = ?', [id]);
  },

  async deleteByProductId(productId: string): Promise<void> {
    await executeSingle('DELETE FROM product_images WHERE product_id = ?', [productId]);
  },

  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    await executeSingle('UPDATE product_images SET sort_order = ? WHERE id = ?', [sortOrder, id]);
  }
};

// Order model
export interface Order {
  id: string;
  customer_id: string;
  status: string;
  total: number | string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithCustomer extends Order {
  customer_first_name?: string;
  customer_last_name?: string;
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

export interface OrderWithItems extends OrderWithCustomer {
  items?: OrderItemWithProduct[];
}

export const OrderModel = {
  async getAll(limit = 50, offset = 0): Promise<OrderWithCustomer[]> {
    return executeQuery<OrderWithCustomer>(
      `SELECT o.*, c.first_name as customer_first_name, c.last_name as customer_last_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async getAllByUser(userId: string, limit = 50, offset = 0): Promise<OrderWithCustomer[]> {
    return executeQuery<OrderWithCustomer>(
      `SELECT o.*, c.first_name as customer_first_name, c.last_name as customer_last_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE c.user_id = ?
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
  },

  async getById(id: string): Promise<Order | null> {
    return getOne<Order>('SELECT * FROM orders WHERE id = ?', [id]);
  },

  async getByIdForUser(id: string, userId: string): Promise<OrderWithCustomer | null> {
    return getOne<OrderWithCustomer>(
      `SELECT o.*, c.first_name as customer_first_name, c.last_name as customer_last_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = ? AND c.user_id = ?`,
      [id, userId]
    );
  },

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM orders');
    return result?.count || 0;
  },

  async getCountByUser(userId: string): Promise<number> {
    const result = await getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE c.user_id = ?`,
      [userId]
    );
    return result?.count || 0;
  },

  async getRecent(limit = 3): Promise<OrderWithCustomer[]> {
    return executeQuery<OrderWithCustomer>(
      `SELECT o.*, c.first_name as customer_first_name, c.last_name as customer_last_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY o.created_at DESC LIMIT ?`,
      [limit]
    );
  },

  async getRecentByUser(userId: string, limit = 3): Promise<OrderWithCustomer[]> {
    return executeQuery<OrderWithCustomer>(
      `SELECT o.*, c.first_name as customer_first_name, c.last_name as customer_last_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE c.user_id = ?
       ORDER BY o.created_at DESC LIMIT ?`,
      [userId, limit]
    );
  },

  async getWithItems(id: string): Promise<OrderWithItems | null> {
    const order = await getOne<OrderWithCustomer>(
      `SELECT o.*, c.first_name as customer_first_name, c.last_name as customer_last_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = ?`,
      [id]
    );

    if (!order) return null;

    const items = await executeQuery<OrderItemWithProduct>(
      `SELECT oi.*, p.name as product_name, p.sku as product_sku
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?
       ORDER BY oi.created_at ASC`,
      [id]
    );

    return { ...order, items };
  },

  async create(data: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const result = await executeSingle(
      `INSERT INTO orders (id, customer_id, status, total, notes)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [data.customer_id, data.status, data.total, data.notes || null]
    );

    const order = await getOne<{ id: string }>(
      'SELECT id FROM orders WHERE customer_id = ? AND total = ? ORDER BY created_at DESC LIMIT 1',
      [data.customer_id, data.total]
    );
    return order!.id;
  },

  async update(id: string, data: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.customer_id !== undefined) {
      fields.push('customer_id = ?');
      values.push(data.customer_id);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.total !== undefined) {
      fields.push('total = ?');
      values.push(data.total);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM orders WHERE id = ?', [id]);
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
    const result = await executeSingle(
      `INSERT INTO order_items (id, order_id, product_id, quantity, price)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [data.order_id, data.product_id, data.quantity, data.price]
    );

    const item = await getOne<{ id: string }>(
      'SELECT id FROM order_items WHERE order_id = ? AND product_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.order_id, data.product_id]
    );
    return item!.id;
  },

  async update(id: string, data: Partial<Omit<OrderItem, 'id' | 'order_id' | 'created_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.product_id !== undefined) {
      fields.push('product_id = ?');
      values.push(data.product_id);
    }
    if (data.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(data.quantity);
    }
    if (data.price !== undefined) {
      fields.push('price = ?');
      values.push(data.price);
    }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE order_items SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM order_items WHERE id = ?', [id]);
  },

  async deleteByOrderId(orderId: string): Promise<void> {
    await executeSingle('DELETE FROM order_items WHERE order_id = ?', [orderId]);
  }
};

// Invoice model
export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  amount: number | string;
  status: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithCustomer extends Invoice {
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  order_total?: number | string;
  order_status?: string;
}

export const InvoiceModel = {
  async getAll(limit = 50, offset = 0): Promise<InvoiceWithCustomer[]> {
    return executeQuery<InvoiceWithCustomer>(
      `SELECT i.*, c.first_name as customer_first_name, c.last_name as customer_last_name, c.email as customer_email
       FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async getAllByUser(userId: string, limit = 50, offset = 0): Promise<InvoiceWithCustomer[]> {
    return executeQuery<InvoiceWithCustomer>(
      `SELECT i.*, c.first_name as customer_first_name, c.last_name as customer_last_name, c.email as customer_email
       FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE c.user_id = ?
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
  },

  async getById(id: string): Promise<Invoice | null> {
    return getOne<Invoice>('SELECT * FROM invoices WHERE id = ?', [id]);
  },

  async getByIdForUser(id: string, userId: string): Promise<InvoiceWithCustomer | null> {
    return getOne<InvoiceWithCustomer>(
      `SELECT i.*, c.first_name as customer_first_name, c.last_name as customer_last_name, c.email as customer_email
       FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE i.id = ? AND c.user_id = ?`,
      [id, userId]
    );
  },

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM invoices');
    return result?.count || 0;
  },

  async getCountByUser(userId: string): Promise<number> {
    const result = await getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE c.user_id = ?`,
      [userId]
    );
    return result?.count || 0;
  },

  async getRecent(limit = 3): Promise<InvoiceWithCustomer[]> {
    return executeQuery<InvoiceWithCustomer>(
      `SELECT i.*, c.first_name as customer_first_name, c.last_name as customer_last_name, c.email as customer_email
       FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY i.created_at DESC LIMIT ?`,
      [limit]
    );
  },

  async getRecentByUser(userId: string, limit = 3): Promise<InvoiceWithCustomer[]> {
    return executeQuery<InvoiceWithCustomer>(
      `SELECT i.*, c.first_name as customer_first_name, c.last_name as customer_last_name, c.email as customer_email
       FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE c.user_id = ?
       ORDER BY i.created_at DESC LIMIT ?`,
      [userId, limit]
    );
  },

  async getWithDetails(id: string): Promise<InvoiceWithCustomer | null> {
    return getOne<InvoiceWithCustomer>(
      `SELECT i.*, c.first_name as customer_first_name, c.last_name as customer_last_name, c.email as customer_email,
              o.total as order_total, o.status as order_status
       FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE i.id = ?`,
      [id]
    );
  },

  async create(data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const result = await executeSingle(
      `INSERT INTO invoices (id, order_id, invoice_number, amount, status, due_date)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [data.order_id, data.invoice_number, data.amount, data.status, data.due_date]
    );

    const invoice = await getOne<{ id: string }>('SELECT id FROM invoices WHERE invoice_number = ? ORDER BY created_at DESC LIMIT 1', [data.invoice_number]);
    return invoice!.id;
  },

  async update(id: string, data: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields = [];
    const values = [];

    if (data.order_id !== undefined) {
      fields.push('order_id = ?');
      values.push(data.order_id);
    }
    if (data.invoice_number !== undefined) {
      fields.push('invoice_number = ?');
      values.push(data.invoice_number);
    }
    if (data.amount !== undefined) {
      fields.push('amount = ?');
      values.push(data.amount);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date);
    }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE invoices SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM invoices WHERE id = ?', [id]);
  },

  async generateInvoiceNumber(): Promise<string> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM invoices');
    const count = result?.count || 0;
    const nextNumber = count + 1;
    return `INV-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, '0')}`;
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
    let query = `
      SELECT i.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE 1=1
    `;
    const params: any[] = [];

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
    let query = `
      SELECT COUNT(*) as count
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

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

  async getById(id: string): Promise<InventoryWithDetails | null> {
    return getOne<InventoryWithDetails>(
      `SELECT i.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name
       FROM inventory i
       LEFT JOIN products p ON i.product_id = p.id
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.id = ?`,
      [id]
    );
  },

  async getByProductAndWarehouse(productId: string, warehouseId: string): Promise<Inventory | null> {
    return getOne<Inventory>(
      'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ?',
      [productId, warehouseId]
    );
  },

  async create(data: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const result = await executeSingle(
      `INSERT INTO inventory (id, product_id, warehouse_id, quantity, min_quantity)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [data.product_id, data.warehouse_id, data.quantity, data.min_quantity]
    );

    const inventory = await getOne<{ id: string }>(
      'SELECT id FROM inventory WHERE product_id = ? AND warehouse_id = ? ORDER BY created_at DESC LIMIT 1',
      [data.product_id, data.warehouse_id]
    );
    return inventory!.id;
  },

  async update(id: string, data: Partial<Omit<Inventory, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(data.quantity);
    }
    if (data.min_quantity !== undefined) {
      fields.push('min_quantity = ?');
      values.push(data.min_quantity);
    }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE inventory SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM inventory WHERE id = ?', [id]);
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

  async adjustQuantity(id: string, adjustment: number, reason?: string): Promise<void> {
    await executeSingle(
      'UPDATE inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [adjustment, id]
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

  async getById(id: string): Promise<Warehouse | null> {
    return getOne<Warehouse>('SELECT * FROM warehouses WHERE id = ?', [id]);
  },

  async create(data: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const result = await executeSingle(
      `INSERT INTO warehouses (id, name, address, city, state, zip)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [data.name, data.address || null, data.city || null, data.state || null, data.zip || null]
    );

    const warehouse = await getOne<{ id: string }>(
      'SELECT id FROM warehouses WHERE name = ? ORDER BY created_at DESC LIMIT 1',
      [data.name]
    );
    return warehouse!.id;
  },

  async update(id: string, data: Partial<Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      values.push(data.address);
    }
    if (data.city !== undefined) {
      fields.push('city = ?');
      values.push(data.city);
    }
    if (data.state !== undefined) {
      fields.push('state = ?');
      values.push(data.state);
    }
    if (data.zip !== undefined) {
      fields.push('zip = ?');
      values.push(data.zip);
    }

    if (fields.length === 0) return;

    values.push(id);
    await executeSingle(
      `UPDATE warehouses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await executeSingle('DELETE FROM warehouses WHERE id = ?', [id]);
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
    return getOne<Role>('SELECT * FROM roles WHERE name = ?', [name]);
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
       CONCAT(u.first_name, ' ', u.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN users u ON c.author_id = u.id
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async getByType(typeId: string, limit = 50, offset = 0): Promise<ContentWithDetails[]> {
    return executeQuery<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(u.first_name, ' ', u.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.type_id = ?
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [typeId, limit, offset]
    );
  },

  async getPublished(limit = 50, offset = 0): Promise<ContentWithDetails[]> {
    return executeQuery<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(u.first_name, ' ', u.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.published = TRUE
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  },

  async getPublishedByType(typeId: string, limit = 50, offset = 0): Promise<ContentWithDetails[]> {
    return executeQuery<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(u.first_name, ' ', u.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.published = TRUE AND c.type_id = ?
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [typeId, limit, offset]
    );
  },

  async getById(id: string): Promise<ContentWithDetails | null> {
    return getOne<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(u.first_name, ' ', u.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.id = ?`,
      [id]
    );
  },

  async getBySlug(slug: string): Promise<ContentWithDetails | null> {
    return getOne<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(u.first_name, ' ', u.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.slug = ?`,
      [slug]
    );
  },

  async search(query: string, limit = 50, offset = 0): Promise<ContentWithDetails[]> {
    const searchTerm = `%${query}%`;
    return executeQuery<ContentWithDetails>(
      `SELECT c.*, ct.name as type_name,
       CONCAT(u.first_name, ' ', u.last_name) as author_name
       FROM content c
       LEFT JOIN content_types ct ON c.type_id = ct.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.title LIKE ? OR c.content LIKE ?
       ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, limit, offset]
    );
  },

  async create(data: Omit<Content, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const result = await executeSingle(
      `INSERT INTO content (id, title, slug, content, type_id, published, author_id)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
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
    const values: any[] = [];

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

  async getPublishedCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM content WHERE published = TRUE');
    return result?.count || 0;
  }
};
