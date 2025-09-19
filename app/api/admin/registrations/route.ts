export async function DELETE(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const draftId = searchParams.get('draftId');
	const userId = searchParams.get('userId');
	const entryIdx = searchParams.get('entryIdx');
	if (!draftId || !userId) return NextResponse.json({ error: 'Missing draftId or userId' }, { status: 400 });
	const db = await getDatabase();
	if (entryIdx !== null && entryIdx !== undefined) {
		// Delete a specific entry for the user
		const reg = await db.collection('registrations').findOne({ draftId, userId });
		if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
		const idx = Number(entryIdx);
		if (isNaN(idx) || idx < 0 || idx >= reg.entries.length) return NextResponse.json({ error: 'Invalid entryIdx' }, { status: 400 });
		reg.entries.splice(idx, 1);
		await db.collection('registrations').updateOne(
			{ draftId, userId },
			{ $set: { entries: reg.entries } }
		);
		return NextResponse.json({ success: true });
	} else {
		// Delete all registrations for the user
		await db.collection('registrations').deleteOne({ draftId, userId });
		return NextResponse.json({ success: true });
	}
}
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


