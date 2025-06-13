import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete all products
    const deletedCount = await ProductModel.deleteAll();

    return NextResponse.json({ 
      message: `Successfully deleted ${deletedCount} product${deletedCount !== 1 ? 's' : ''}`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error deleting all products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
