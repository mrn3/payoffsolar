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

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM customers');
    return result?.count || 0;
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

export const ProductModel = {
  async getAll(limit = 50, offset = 0): Promise<Product[]> {
    return executeQuery<Product>(
      'SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  },

  async getById(id: string): Promise<Product | null> {
    return getOne<Product>('SELECT * FROM products WHERE id = ?', [id]);
  },

  async getCount(): Promise<number> {
    const result = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
    return result?.count || 0;
  }
};

// Order model
export interface Order {
  id: string;
  customer_id: string;
  status: string;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithCustomer extends Order {
  customer_first_name?: string;
  customer_last_name?: string;
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
  }
};

// Invoice model
export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithCustomer extends Invoice {
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
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
  warehouse_name?: string;
}

export const InventoryModel = {
  async getLowStock(limit = 10): Promise<InventoryWithDetails[]> {
    return executeQuery<InventoryWithDetails>(
      `SELECT i.*, p.name as product_name, w.name as warehouse_name
       FROM inventory i
       LEFT JOIN products p ON i.product_id = p.id
       LEFT JOIN warehouses w ON i.warehouse_id = w.id
       WHERE i.quantity <= i.min_quantity
       ORDER BY i.updated_at DESC LIMIT ?`,
      [limit]
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
