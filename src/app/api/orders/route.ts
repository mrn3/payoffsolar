import { NextRequest, NextResponse } from 'next/server';
import {OrderItemModel, ContactModel, ProductModel} from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _searchParams } = new URL(_request.url);
    const page = parseInt(_searchParams.get('page') || '1');
    const limit = parseInt(_searchParams.get('limit') || '50');
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
  } catch (_error) {
    console.error('Error fetching orders:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    
    // Validate required fields
    if (!data.contact_id || !data.status || !data.order_date || data.items === undefined || !Array.isArray(_data.items)) {
      return NextResponse.json({
        _error: 'Contact ID, status, _order date, and items array are required'
      }, { status: 400 });
    }

    if (_data.items.length === 0) {
      return NextResponse.json({ 
        _error: 'Order must have at least one item' }, { status: 400 });
    }

    // Validate contact exists
    const contact = await ContactModel.getById(_data.contact_id);
    if (!contact) {
      return NextResponse.json({ _error: 'Contact not found' }, { status: 404 });
    }

    // Validate order_date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(_data.order_date)) {
      return NextResponse.json({
        _error: 'Order date must be in YYYY-MM-DD format'
      }, { status: 400 });
    }

    // Validate items and calculate total
    let total = 0;
    for (const item of data.items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.price || item.price < 0) {
        return NextResponse.json({ 
          _error: 'Each item must have product_id, positive quantity, and non-negative price' }, { status: 400 });
      }

      // Validate product exists
      const product = await ProductModel.getById(item.product_id);
      if (!product) {
        return NextResponse.json({ 
          _error: `Product with ID ${item.product_id} not found` 
        }, { status: 404 });
      }

      total += parseFloat(item.price) * parseInt(item.quantity);
    }

    // Create order
    const orderId = await OrderModel.create({
      contact_id: data.contact_id,
      status: data.status,
      total: total,
      order_date: data.order_date,
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
    return NextResponse.json({ _order: newOrder }, { status: 201 });
  } catch (_error) {
    console.error('Error creating _order:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
