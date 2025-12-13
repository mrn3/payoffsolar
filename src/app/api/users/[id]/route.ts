import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { UserModel } from '@/lib/models';

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Require admin access
		const session = await requireAuth();
		if (!isAdmin(session.profile.role)) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
		}

		const { id } = params;
		const data = await request.json();
		const role = (data?.role ?? '').toString();

		// For now, only allow switching between admin and contact from this endpoint
		const allowedRoles = ['admin', 'contact'];
		if (!allowedRoles.includes(role)) {
			return NextResponse.json(
				{ error: 'Invalid role. Allowed roles are: admin, contact.' },
				{ status: 400 }
			);
		}

		// Ensure the user exists
		const existingUser = await UserModel.getById(id);
		if (!existingUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		await UserModel.updateRole(id, role);
		const updatedUser = await UserModel.getById(id);

		return NextResponse.json({ user: updatedUser });
	} catch (error) {
		console.error('Error updating user role:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
