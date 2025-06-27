import { NextRequest, NextResponse } from 'next/server';
import { ProductModel, WarehouseModel } from '@/lib/models';
import { getShippingQuote, ShippingCalculationRequest } from '@/lib/utils/shipping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, shippingAddress, warehouseId } = body;

    // Validate required fields
    if (!productId || !quantity || !shippingAddress) {
      return NextResponse.json(
        { error: 'Product ID, quantity, and shipping address are required' },
        { status: 400 }
      );
    }

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
      return NextResponse.json(
        { error: 'Complete shipping address is required (address, city, state, zip)' },
        { status: 400 }
      );
    }

    // Get product with shipping methods
    const product = await ProductModel.getById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get warehouse if specified or if product has distance-based shipping
    let warehouse = null;
    if (warehouseId) {
      warehouse = await WarehouseModel.getById(warehouseId);
    } else if (product.shipping_methods?.some(method => method.type === 'calculated_distance')) {
      // Find the first warehouse used by distance-based shipping methods
      const distanceMethod = product.shipping_methods.find(method => method.type === 'calculated_distance');
      if (distanceMethod?.warehouse_id) {
        warehouse = await WarehouseModel.getById(distanceMethod.warehouse_id);
      }
    }

    // Prepare shipping calculation request
    const calculationRequest: ShippingCalculationRequest = {
      productId,
      quantity: parseInt(quantity),
      shippingAddress: {
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country || 'US'
      },
      warehouseId: warehouse?.id
    };

    // Calculate shipping quote
    const quote = await getShippingQuote(
      product.shipping_methods || [],
      calculationRequest,
      warehouse || undefined
    );

    return NextResponse.json({
      quote,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      warehouse: warehouse ? {
        id: warehouse.id,
        name: warehouse.name,
        city: warehouse.city,
        state: warehouse.state
      } : null
    });

  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product with shipping methods
    const product = await ProductModel.getById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get all warehouses for distance-based shipping
    const warehouses = await WarehouseModel.getAll();

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        shipping_methods: product.shipping_methods || []
      },
      warehouses: warehouses.map(w => ({
        id: w.id,
        name: w.name,
        city: w.city,
        state: w.state
      }))
    });

  } catch (error) {
    console.error('Error fetching shipping info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
