import { NextRequest, NextResponse } from 'next/server';
import { InvoiceModel, OrderModel } from '@/lib/models';
import { requireAuth, isAdmin, isCustomer } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth();
    const profile = session.profile;

    const { id } = await params;
    
    let invoice;
    if (isCustomer(profile.role)) {
      // Customer users can only see their own invoices
      invoice = await InvoiceModel.getByIdForUser(id, profile.id);
    } else {
      // Admin and other roles can see all invoices
      invoice = await InvoiceModel.getWithDetails(id);
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
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

    // Check if invoice exists
    const existingInvoice = await InvoiceModel.getById(id);
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // If order_id is being changed, verify the new order exists
    if (data.order_id && data.order_id !== existingInvoice.order_id) {
      const order = await OrderModel.getById(data.order_id);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    await InvoiceModel.update(id, data);
    const updatedInvoice = await InvoiceModel.getWithDetails(id);
    
    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
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

    // Check if invoice exists
    const existingInvoice = await InvoiceModel.getById(id);
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await InvoiceModel.delete(id);
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
