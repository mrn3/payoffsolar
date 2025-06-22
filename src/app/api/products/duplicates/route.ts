import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';
import { findProductDuplicates } from '@/lib/utils/duplicates';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold') || '70');

    // Get all products for duplicate detection
    const allProducts = await ProductModel.getAll(10000, 0); // Get a large number to include all products

    // Find duplicates
    const duplicateGroups = findProductDuplicates(allProducts, threshold);

    return NextResponse.json({
      duplicateGroups,
      totalGroups: duplicateGroups.length,
      totalDuplicateProducts: duplicateGroups.reduce((sum, group) => sum + group.products.length, 0)
    });
  } catch (error) {
    console.error('Error finding product duplicates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
