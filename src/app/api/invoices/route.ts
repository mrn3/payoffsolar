import { NextRequest, NextResponse } from 'next/server';
import { InvoiceModel, OrderModel } from '@/lib/models';
import { requireAuth, isAdmin, isCustomer } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();
    const profile = session.profile;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let invoices;
    let total;

    if (isCustomer(profile.role)) {
      // Customer users only see their own invoices
      invoices = await InvoiceModel.getAllByUser(profile.id, limit, offset);
      total = await InvoiceModel.getCountByUser(profile.id);
    } else {
      // Admin and other roles see all invoices
      invoices = await InvoiceModel.getAll(limit, offset);
      total = await InvoiceModel.getCount();
    }

    return NextResponse.json({ 
      invoices, 
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
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
    if (!data.order_id || !data.amount || !data.status) {
      return NextResponse.json({ 
        error: 'Order ID, amount, and status are required' 
      }, { status: 400 });
    }

    // Verify the order exists
    const order = await OrderModel.getById(data.order_id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate invoice number if not provided
    if (!data.invoice_number) {
      data.invoice_number = await InvoiceModel.generateInvoiceNumber();
    }

    // Set default due date if not provided (30 days from now)
    if (!data.due_date) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      data.due_date = dueDate.toISOString().split('T')[0];
    }

    const invoiceId = await InvoiceModel.create({
      order_id: data.order_id,
      invoice_number: data.invoice_number,
      amount: data.amount,
      status: data.status,
      due_date: data.due_date
    });

    const invoice = await InvoiceModel.getWithDetails(invoiceId);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
