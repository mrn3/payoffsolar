import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { InventoryModel, WarehouseModel } from '@/lib/models';

// Returns warehouses with available inventory (> 0) for the given product id
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication (dashboard usage); tighten to admin if needed later
    await requireAuth();

    const { id: productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const inventories = await InventoryModel.getByProductId(productId);
    const filtered = inventories.filter((inv) => (inv.quantity || 0) > 0);

    // Attach warehouse names
    const warehouses = await Promise.all(
      filtered.map(async (inv) => {
        const w = await WarehouseModel.getById(inv.warehouse_id);
        return {
          id: inv.warehouse_id,
          name: w?.name || inv.warehouse_id,
          available_quantity: inv.quantity,
        };
      })
    );

    // Deduplicate by warehouse id (in case multiple rows — should not, but safe)
    const uniqueMap = new Map<string, { id: string; name: string; available_quantity: number }>();
    for (const w of warehouses) {
      const existing = uniqueMap.get(w.id);
      if (!existing) uniqueMap.set(w.id, w);
      else existing.available_quantity += w.available_quantity;
    }

    return NextResponse.json({ warehouses: Array.from(uniqueMap.values()) });
  } catch (error) {
    console.error('Error fetching product warehouses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
