import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { OrderModel, OrderItemModel, ContactModel, ProductModel } from '@/lib/models';

interface ImportOrderItem {
  contact_email?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_name?: string;
  status?: string;
  order_date?: string;
  notes?: string;
  product_sku?: string;
  product_name?: string;
  quantity: string | number;
  price: string | number;
}

interface ProcessedOrder {
  contact_id: string;
  status: string;
  order_date: string;
  notes?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { orderItems } = await request.json();

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json({ 
        error: 'Order items array is required and cannot be empty' 
      }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Group order items by contact and order details
    const orderGroups = new Map<string, ProcessedOrder>();

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];

      try {
        // Debug logging
        console.log(`Processing row ${i + 1}:`, JSON.stringify(item, null, 2));

        // Validate required fields
        if (!item.quantity || !item.price) {
          throw new Error(`Row ${i + 1}: Quantity and price are required`);
        }

        const quantity = parseInt(item.quantity.toString());
        const price = parseFloat(item.price.toString());

        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Row ${i + 1}: Quantity must be a positive number`);
        }

        if (isNaN(price) || price < 0) {
          throw new Error(`Row ${i + 1}: Price must be a non-negative number`);
        }

        // Validate and process order_date
        let orderDate = item.order_date?.trim();
        if (orderDate) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(orderDate)) {
            throw new Error(`Row ${i + 1}: Order date must be in YYYY-MM-DD format`);
          }
        } else {
          // Default to today's date if not provided
          orderDate = new Date().toISOString().split('T')[0];
        }

        // Find or create contact
        let contact = null;
        
        if (item.contact_email) {
          contact = await ContactModel.getByEmail(item.contact_email.trim());
        }
        
        if (!contact && item.contact_name) {
          // Try to find by name if email not found
          const contacts = await ContactModel.getAll(1000, 0); // Get a large number to search through
          contact = contacts.find(c =>
            c.name.toLowerCase() === item.contact_name.toLowerCase().trim()
          );
        }

        if (!contact) {
          // Create new contact
          if (!item.contact_name && !item.contact_email) {
            throw new Error(`Row ${i + 1}: Contact name or email is required to create contact`);
          }

          const contactId = await ContactModel.create({
            name: item.contact_name?.trim() || 'Unknown',
            email: item.contact_email?.trim() || '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            notes: null,
            user_id: null
          });

          contact = await ContactModel.getById(contactId);
        }

        if (!contact) {
          throw new Error(`Row ${i + 1}: Failed to create or find contact`);
        }

        // Find or create product
        let product = null;

        if (item.product_sku) {
          product = await ProductModel.getBySku(item.product_sku.trim());
        }

        if (!product && item.product_name) {
          const products = await ProductModel.getAllIncludingInactive(1000, 0); // Get a large number to search through
          product = products.find(p =>
            p.name.toLowerCase() === item.product_name.toLowerCase().trim()
          );
        }

        if (!product) {
          // Create new product
          if (!item.product_name) {
            throw new Error(`Row ${i + 1}: Product name is required to create product`);
          }

          // Generate SKU if not provided
          const sku = item.product_sku?.trim() || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

          const productId = await ProductModel.create({
            name: item.product_name.trim(),
            description: `Auto-created product from order import`,
            price: parseFloat(item.price.toString()) || 0,
            image_url: null,
            category_id: null,
            sku: sku,
            is_active: true
          });

          product = await ProductModel.getById(productId);
        }

        if (!product) {
          throw new Error(`Row ${i + 1}: Failed to create or find product`);
        }

        // Create order group key (contact + status + order_date + notes)
        const status = item.status?.trim() || 'pending';
        const notes = item.notes?.trim() || '';
        const orderKey = `${contact.id}-${status}-${orderDate}-${notes}`;

        if (!orderGroups.has(orderKey)) {
          orderGroups.set(orderKey, {
            contact_id: contact.id,
            status: status,
            order_date: orderDate,
            notes: notes || undefined,
            items: []
          });
        }

        const orderGroup = orderGroups.get(orderKey)!;
        orderGroup.items.push({
          product_id: product.id,
          quantity: quantity,
          price: price
        });

      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : `Row ${i + 1}: Unknown error`;
        errors.push(errorMessage);
        console.error(`Error processing order item at row ${i + 1}:`, error);
      }
    }

    // Create orders from groups
    for (const [orderKey, orderData] of orderGroups) {
      try {
        // Calculate total
        const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        const orderId = await OrderModel.create({
          contact_id: orderData.contact_id,
          status: orderData.status,
          total: total,
          order_date: orderData.order_date,
          notes: orderData.notes || null
        });

        // Create order items
        for (const item of orderData.items) {
          await OrderItemModel.create({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          });
        }

        successCount++;
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : `Order creation failed`;
        errors.push(errorMessage);
        console.error(`Error creating order:`, error);
      }
    }

    return NextResponse.json({
      success: successCount,
      errors: errorCount,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Error importing orders:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
