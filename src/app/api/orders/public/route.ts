import { NextRequest, NextResponse } from 'next/server';
import { OrderModel, OrderItemModel, ContactModel } from '@/lib/models';
import stripe from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, customerInfo, items, shipping } = body;

    // Validate required fields
    if (!paymentIntentId || !customerInfo || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Create or find contact
    let contact = await ContactModel.getByEmail(customerInfo.email);
    
    if (!contact) {
      // Create new contact
      const contactId = await ContactModel.create({
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone || '',
        address: customerInfo.address || '',
        city: customerInfo.city || '',
        state: customerInfo.state || '',
        zip: customerInfo.zip || '',
        notes: 'Created from online order',
      });
      
      contact = await ContactModel.getById(contactId);
    }

    if (!contact) {
      return NextResponse.json(
        { error: 'Failed to create contact' },
        { status: 500 }
      );
    }

    // Calculate total from payment intent metadata
    const total = parseFloat(paymentIntent.metadata.total || '0');

    // Create order
    const orderId = await OrderModel.create({
      contact_id: contact.id,
      status: 'confirmed',
      total: total,
      notes: `Online order - Payment ID: ${paymentIntentId}${shipping ? `, Shipping: ${shipping.method}` : ''}`,
    });

    // Create order items
    for (const item of items) {
      await OrderItemModel.create({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product_price,
      });
    }

    // Get the complete order with items
    const newOrder = await OrderModel.getWithItems(orderId);

    return NextResponse.json({ 
      success: true,
      order: newOrder,
      message: 'Order created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
