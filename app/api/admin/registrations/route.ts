import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/admin';

export async function GET(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const draftId = searchParams.get('draftId');
	if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });
	const db = await getDatabase();
	const regs = await db.collection('registrations').find({ draftId }).toArray();
	// Group by batch
	const grouped: Record<string, any[]> = {};
	for (const r of regs) {
		if (!grouped[r.batch]) grouped[r.batch] = [];
		grouped[r.batch].push(r);
	}
	const batches = Object.keys(grouped).sort();
	return NextResponse.json({ batches, grouped });
}


