import { NextRequest, NextResponse } from 'next/server';
import { CustomerModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { isValidPhoneNumber } from '@/lib/utils/phone';

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
    const offset = (page - 1) * limit;

    let customers;
    let total;

    if (search) {
      customers = await CustomerModel.search(search, limit, offset);
      total = await CustomerModel.getSearchCount(search);
    } else {
      customers = await CustomerModel.getAll(limit, offset);
      total = await CustomerModel.getCount();
    }

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
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

    // Validate required fields (only first_name is required)
    if (!data.first_name || !data.first_name.trim()) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    // Validate email format if provided
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    // Validate phone format if provided
    if (data.phone && data.phone.trim() && !isValidPhoneNumber(data.phone)) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 });
    }

    const customerId = await CustomerModel.create({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      notes: data.notes || null,
      user_id: data.user_id || null
    });

    const customer = await CustomerModel.getById(customerId);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
