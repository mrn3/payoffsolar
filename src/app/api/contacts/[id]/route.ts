import { NextRequest, NextResponse } from 'next/server';
import { ContactModel } from '@/lib/models';
import {requireAuth, isAdmin} from '@/lib/auth';
import { isValidPhoneNumber } from '@/lib/utils/phone';
import { geocodeContactAddress } from '@/lib/geocode';
import { handleApiError } from '@/lib/apiError';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const contact = await ContactModel.getById(id);
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (_error) {
    console.error('Error fetching contact:', _error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await _request.json();

    // Check if contact exists
    const existingContact = await ContactModel.getById(id);
    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Validate required fields (only name is required for updates)
    if (data.name !== undefined && !data.name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
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
      return NextResponse.json({ error: 'Phone number must be 10 digits or 11 digits with +1' }, { status: 400 });
    }

    const addressFields = ['address', 'city', 'state', 'zip'] as const;
    const addressChanged = addressFields.some((f) => data[f] !== undefined && data[f] !== existingContact[f]);

    await ContactModel.update(id, {
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

    // When address changes, geocode and update lat/lng
    if (addressChanged) {
      const address = data.address ?? existingContact.address;
      const city = data.city ?? existingContact.city;
      const state = data.state ?? existingContact.state;
      const zip = data.zip ?? existingContact.zip;
      const addressQuery = [address, city, state, zip].filter(Boolean).join(', ');
      if (addressQuery.trim()) {
        try {
          const coords = await geocodeContactAddress({ address, city, state, zip });
          if (coords) {
            await ContactModel.update(id, { latitude: coords.lat, longitude: coords.lng });
          } else {
            await ContactModel.update(id, { latitude: null, longitude: null });
          }
        } catch (_err) {
          // Non-fatal
        }
      } else {
        await ContactModel.update(id, { latitude: null, longitude: null });
      }
    }

    const updatedContact = await ContactModel.getById(id);
    return NextResponse.json({ contact: updatedContact });
  } catch (_error) {
    const { status, body } = handleApiError(_error, 'contacts PUT');
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Check if contact exists
    const existingContact = await ContactModel.getById(id);
    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    await ContactModel.delete(id);
    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (_error) {
    console.error('Error deleting contact:', _error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
