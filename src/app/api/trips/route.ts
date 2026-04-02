import { NextRequest, NextResponse } from 'next/server';
import { TripModel } from '@/lib/models';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get trips created by the current user
    const trips = await TripModel.getAll(session.user.id, limit, offset);

    return NextResponse.json({
      trips,
      pagination: {
        page,
        limit,
        total: trips.length,
        totalPages: Math.ceil(trips.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    const body = await request.json();
    const { name, description, trip_date, status } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Trip name is required' },
        { status: 400 }
      );
    }

    // Create trip
    const tripId = await TripModel.create({
      name: name.trim(),
      description: description || null,
      trip_date: trip_date || null,
      status: status || 'planned',
      created_by: session.user.id
    });

    const trip = await TripModel.getById(tripId);
    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
