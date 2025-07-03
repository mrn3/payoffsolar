import { NextRequest, NextResponse } from 'next/server';
import { CommunicationHistoryModel } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get communication history for the contact
    const communications = await CommunicationHistoryModel.getByContactId(contactId, limit, offset);
    const totalCount = await CommunicationHistoryModel.getCount(contactId);

    return NextResponse.json({
      communications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching communication history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communication history' },
      { status: 500 }
    );
  }
}
