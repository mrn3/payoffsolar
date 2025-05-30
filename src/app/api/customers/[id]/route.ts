import { NextRequest, NextResponse } from 'next/server';
import { CustomerModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const customer = await CustomerModel.getById(params.id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Check if customer exists
    const existingCustomer = await CustomerModel.getById(params.id);
    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Validate required fields (only first_name and last_name are required for updates)
    if (data.first_name !== undefined && !data.first_name.trim()) {
      return NextResponse.json({ error: 'First name cannot be empty' }, { status: 400 });
    }
    if (data.last_name !== undefined && !data.last_name.trim()) {
      return NextResponse.json({ error: 'Last name cannot be empty' }, { status: 400 });
    }

    // Validate email format if provided
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    await CustomerModel.update(params.id, {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      notes: data.notes,
      user_id: data.user_id
    });

    const updatedCustomer = await CustomerModel.getById(params.id);
    return NextResponse.json({ customer: updatedCustomer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if customer exists
    const existingCustomer = await CustomerModel.getById(params.id);
    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await CustomerModel.delete(params.id);
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
