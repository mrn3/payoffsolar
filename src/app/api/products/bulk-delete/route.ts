import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/lib/models';
import { requireAuth , isAdmin} from '@/lib/auth';

export async function DELETE(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    // Delete all products
    const deletedCount = await ProductModel.deleteAll();

    return NextResponse.json({ 
      message: `Successfully deleted ${deletedCount} product${deletedCount !== 1 ? 's' : ''}`,
      deletedCount 
    });
  } catch (_error) {
    console.error('Error deleting all products:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
