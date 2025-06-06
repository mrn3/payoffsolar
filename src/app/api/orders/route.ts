import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, OrderItemModel, CustomerModel, ProductModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const orders = await OrderModel.getAll(limit, offset);
    const total = await OrderModel.getCount();

    return NextResponse.json({ 
      orders, 
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.customer_id || !data.status || data.items === undefined || !Array.isArray(data.items)) {
      return NextResponse.json({ 
        error: 'Customer ID, status, and items array are required' 
      }, { status: 400 });
    }

    if (data.items.length === 0) {
      return NextResponse.json({ 
        error: 'Order must have at least one item' 
      }, { status: 400 });
    }

    // Validate customer exists
    const customer = await CustomerModel.getById(data.customer_id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Validate items and calculate total
    let total = 0;
    for (const item of data.items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.price || item.price < 0) {
        return NextResponse.json({ 
          error: 'Each item must have product_id, positive quantity, and non-negative price' 
        }, { status: 400 });
      }

      // Validate product exists
      const product = await ProductModel.getById(item.product_id);
      if (!product) {
        return NextResponse.json({ 
          error: `Product with ID ${item.product_id} not found` 
        }, { status: 404 });
      }

      total += parseFloat(item.price) * parseInt(item.quantity);
    }

    // Create order
    const orderId = await OrderModel.create({
      customer_id: data.customer_id,
      status: data.status,
      total: total,
      notes: data.notes || null
    });

    // Create order items
    for (const item of data.items) {
      await OrderItemModel.create({
        order_id: orderId,
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      });
    }

    // Get the complete order with items
    const newOrder = await OrderModel.getWithItems(orderId);
    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
