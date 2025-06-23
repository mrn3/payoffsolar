import { NextRequest, NextResponse } from 'next/server';
import {OrderModel, OrderItemModel, ContactModel, ProductModel, CostItemModel, CostCategoryModel, ProductCostBreakdownModel} from '@/lib/models';
import {requireAuth, isAdmin} from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const order = await OrderModel.getWithItems(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if order exists
    const existingOrder = await OrderModel.getById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate contact if provided
    if (data.contact_id) {
      const contact = await ContactModel.getById(data.contact_id);
      if (!contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
    }

    // Validate order_date format if provided
    if (data.order_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.order_date)) {
        return NextResponse.json({
          error: 'Order date must be in YYYY-MM-DD format'
        }, { status: 400 });
      }
    }

    // If items are provided, validate and update them
    if (data.items !== undefined) {
      if (!Array.isArray(data.items)) {
        return NextResponse.json({
          error: 'Items must be an array' }, { status: 400 });
      }

      // Calculate new total if items are being updated
      let total = 0;
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

        total += parseFloat(item.price) * parseInt(item.quantity);
      }

      // Delete existing items and create new ones
      await OrderItemModel.deleteByOrderId(id);

      for (const item of data.items) {
        await OrderItemModel.create({
          order_id: id,
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        });
      }

      // Update total with items
      data.total = total;

      // If cost items are not explicitly provided, regenerate them from product defaults
      if (data.costItems === undefined) {
        // Delete existing cost items
        await CostItemModel.deleteByOrderId(id);

        // Generate cost items from product default cost breakdowns
        const allCostItems = [];
        for (const item of data.items) {
          const productCostItems = await ProductCostBreakdownModel.calculateCostItems(
            item.product_id,
            parseInt(item.quantity),
            parseFloat(item.price)
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
            order_id: id,
            category_id: costItem.category_id,
            amount: costItem.amount
          });
        }
      }
    }

    // Handle cost items if provided
    if (data.costItems !== undefined) {
      if (!Array.isArray(data.costItems)) {
        return NextResponse.json({
          error: 'Cost items must be an array' }, { status: 400 });
      }

      // Validate cost items (but don't include in order total)
      for (const costItem of data.costItems) {
        if (!costItem.category_id || costItem.amount === undefined) {
          return NextResponse.json({
            error: 'Each cost item must have category_id and amount' }, { status: 400 });
        }

        // Validate category exists
        const category = await CostCategoryModel.getById(costItem.category_id);
        if (!category) {
          return NextResponse.json({
            error: `Cost category with ID ${costItem.category_id} not found`
          }, { status: 404 });
        }
      }

      // Delete existing cost items and create new ones
      await CostItemModel.deleteByOrderId(id);

      for (const costItem of data.costItems) {
        await CostItemModel.create({
          order_id: id,
          category_id: costItem.category_id,
          amount: parseFloat(costItem.amount)
        });
      }
    }

    // Update order
    await OrderModel.update(id, {
      contact_id: data.contact_id,
      status: data.status,
      total: data.total,
      order_date: data.order_date,
      notes: data.notes
    });

    const updatedOrder = await OrderModel.getWithItems(id);
    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Check if order exists
    const existingOrder = await OrderModel.getById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await OrderModel.delete(id);
    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
