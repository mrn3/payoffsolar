import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isContact } from '@/lib/auth';
import { PaymentModel } from '@/lib/models';

// GET /api/payments?order_id=xxx - Get all payments for an order
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      );
    }

    const payments = await PaymentModel.getByOrderId(orderId);
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Only admin users can create payments
    if (isContact(session.profile.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { order_id, payment_date, payment_type, amount, notes } = body;

    // Validate required fields
    if (!order_id || !payment_date || !payment_type || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, payment_date, payment_type, amount' },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const paymentId = await PaymentModel.create({
      order_id,
      payment_date,
      payment_type,
      amount: Number(amount),
      notes: notes || null
    });

    const payment = await PaymentModel.getById(paymentId);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

