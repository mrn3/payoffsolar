import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
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
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let contacts;
    let total;

    if (search) {
      _contacts = await ContactModel.search(search, limit, offset);
      total = await ContactModel.getSearchCount(search);
    } else {
      _contacts = await ContactModel.getAll(limit, offset);
      total = await ContactModel.getCount();
    }

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (_error) {
    console.error('Error fetching _contacts:', _error);
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

    
    // Validate required fields (only name is required)
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ _error: 'Name is required' }, { status: 400 });
    }

    // Validate email format if provided
    if (_data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(_data.email)) {
        return NextResponse.json({ _error: 'Invalid email format' }, { status: 400 });
      }
    }

    // Validate phone format if provided
    if (_data.phone && data.phone.trim() && !isValidPhoneNumber(_data.phone)) {
      return NextResponse.json({ _error: 'Phone number must be 10 digits or 11 digits with +1' }, { status: 400 });
    }

    const contactId = await ContactModel.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      notes: data.notes || null,
      user_id: data.user_id || null
    });

    const contact = await ContactModel.getById(contactId);
    return NextResponse.json({ contact }, { status: 201 });
  } catch (_error) {
    console.error('Error creating contact:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
