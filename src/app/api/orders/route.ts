import { NextRequest, NextResponse } from 'next/server';
import {OrderModel, OrderItemModel, ContactModel, ProductModel, ProductCostBreakdownModel, CostItemModel} from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';
import { processOrderItems, validateInventoryForOrder } from '@/lib/utils/orderProcessing';

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
    const search = searchParams.get('search') || '';
    const contactName = searchParams.get('contactName') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const status = searchParams.get('status') || '';
    const minTotal = searchParams.get('minTotal') ? parseFloat(searchParams.get('minTotal')!) : null;
    const maxTotal = searchParams.get('maxTotal') ? parseFloat(searchParams.get('maxTotal')!) : null;
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const offset = (page - 1) * limit;

    // Build filter object
    const filters = {
      search,
      contactName,
      city,
      state,
      status,
      minTotal,
      maxTotal,
      startDate,
      endDate
    };

    // Check if any filters are applied
    const hasFilters = Object.values(filters).some(value =>
      value !== '' && value !== null && value !== undefined
    );

    let orders;
    let total;

    if (hasFilters) {
      orders = await OrderModel.searchWithFilters(filters, limit, offset);
      total = await OrderModel.getFilteredCount(filters);
    } else {
      orders = await OrderModel.getAll(limit, offset);
      total = await OrderModel.getCount();
    }

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
    if (!data.contact_id || !data.status || !data.order_date || data.items === undefined || !Array.isArray(data.items)) {
      return NextResponse.json({
        error: 'Contact ID, status, order date, and items array are required'
      }, { status: 400 });
    }

    if (data.items.length === 0) {
      return NextResponse.json({
        error: 'Order must have at least one item' }, { status: 400 });
    }

    // Validate contact exists
    const contact = await ContactModel.getById(data.contact_id);
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Validate order_date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.order_date)) {
      return NextResponse.json({
        error: 'Order date must be in YYYY-MM-DD format'
      }, { status: 400 });
    }

    // Validate items and process bundles
    for (const item of data.items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.price || item.price < 0) {
        return NextResponse.json({
          error: 'Each item must have product_id, positive quantity, and non-negative price' }, { status: 400 });
      }

      // Validate product exists
      const product = await ProductModel.getById(item.product_id);
      if (!product) {
        return NextResponse.json({
          error: `Product with ID ${item.product_id} not found`
        }, { status: 404 });
      }
    }

    // Process order items (expand bundles if needed)
    const processedItems = await processOrderItems(data.items, {
      expandBundles: data.expandBundles !== false, // Default to true unless explicitly false
      preserveBundleStructure: false
    });

    // Validate inventory for processed items
    const inventoryValidation = await validateInventoryForOrder(processedItems);
    if (!inventoryValidation.valid) {
      return NextResponse.json({
        error: 'Insufficient inventory',
        details: inventoryValidation.errors
      }, { status: 400 });
    }

    // Calculate total from processed items
    let total = 0;
    for (const item of processedItems) {
      total += parseFloat(item.price.toString()) * parseInt(item.quantity.toString());
    }

    // Create order
    const orderId = await OrderModel.create({
      contact_id: data.contact_id,
      status: data.status,
      total: total,
      order_date: data.order_date,
      notes: data.notes || null
    });

    // Create order items from processed items
    for (const item of processedItems) {
      await OrderItemModel.create({
        order_id: orderId,
        product_id: item.product_id,
        quantity: parseInt(item.quantity.toString()),
        price: parseFloat(item.price.toString())
      });
    }

    // Generate cost items from product default cost breakdowns
    const allCostItems = [];
    for (const item of processedItems) {
      const productCostItems = await ProductCostBreakdownModel.calculateCostItems(
        item.product_id,
        parseInt(item.quantity.toString()),
        parseFloat(item.price.toString())
      );
      allCostItems.push(...productCostItems);
    }

    // Merge cost items by category (sum amounts for same category)
    const mergedCostItems = new Map();
    for (const costItem of allCostItems) {
      const key = costItem.category_id;
      if (mergedCostItems.has(key)) {
        const existing = mergedCostItems.get(key);
        existing.amount += costItem.amount;
      } else {
        mergedCostItems.set(key, { ...costItem });
      }
    }

    // Create the merged cost items
    for (const costItem of mergedCostItems.values()) {
      await CostItemModel.create({
        order_id: orderId,
        category_id: costItem.category_id,
        amount: costItem.amount
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
