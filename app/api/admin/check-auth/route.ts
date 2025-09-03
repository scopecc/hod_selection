import { NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/admin';

export async function GET(req: Request) {
	const isAdmin = requireAdminFromRequest(req);
	if (!isAdmin) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	return NextResponse.json({ success: true, authenticated: true });
}
