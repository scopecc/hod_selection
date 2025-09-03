import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/admin';

export async function GET(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const draftId = searchParams.get('draftId');
	if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });
	
	const db = await getDatabase();
	const registrations = await db.collection('registrations')
		.find({ draftId })
		.sort({ userName: 1, batch: 1 }) // Sort by user name and then by batch
		.toArray();

	return NextResponse.json({ registrations });
}


