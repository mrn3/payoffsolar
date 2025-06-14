import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import {requireAuth, isAdmin} from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;
    const contact = await ContactModel.getById(_id);
    if (!contact) {
      return NextResponse.json({ _error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (_error) {
    console.error('Error fetching contact:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;
    
    // Check if contact exists
    const existingContact = await ContactModel.getById(_id);
    if (!existingContact) {
      return NextResponse.json({ _error: 'Contact not found' }, { status: 404 });
    }

    // Validate required fields (only name is required for updates)
    if (_data.name !== undefined && !data.name.trim()) {
      return NextResponse.json({ _error: 'Name cannot be empty' }, { status: 400 });
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

    await ContactModel.update(_id, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      notes: data.notes,
      user_id: data.user_id
    });

    const updatedContact = await ContactModel.getById(_id);
    return NextResponse.json({ contact: updatedContact });
  } catch (_error) {
    console.error('Error updating contact:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const { _id } = await params;

    // Check if contact exists
    const existingContact = await ContactModel.getById(_id);
    if (!existingContact) {
      return NextResponse.json({ _error: 'Contact not found' }, { status: 404 });
    }

    await ContactModel.delete(_id);
    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (_error) {
    console.error('Error deleting contact:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
