import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const draftId = searchParams.get('draftId');
	if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });
	const db = await getDatabase();
	const reg = await db.collection('registrations').findOne({ draftId, userId: session.user.id });
	return NextResponse.json({ registration: reg || null });
}

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const body = await req.json();
	const { draftId, entries, status } = body || {};
	if (!draftId || !Array.isArray(entries)) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
	const db = await getDatabase();
	const userId = session.user.id as string;
	const userName = session.user.name || '';
	const department = (session.user as any).department || '';
	const now = new Date();

	// Ensure totalSlots = fnSlots + anSlots and sanitize types
	const normalizedEntries = entries.map((e: any) => {
		const fnSlots = Number(e.fnSlots || 0);
		const anSlots = Number(e.anSlots || 0);
		return {
			courseCode: String(e.courseCode || ''),
			courseName: String(e.courseName || ''),
			credits: Number(e.credits || 0),
			studentStrength: Number(e.studentStrength || 0),
			fnSlots,
			anSlots,
			totalSlots: fnSlots + anSlots,
			facultySchool: String(e.facultySchool || ''),
			batch: String(e.batch || ''),
		};
	});
	await db.collection('registrations').updateOne(
		{ draftId, userId },
		{ $set: { draftId, userId, userName, department, entries: normalizedEntries, status: status || 'draft', updatedAt: now, createdAt: now } },
		{ upsert: true }
	);
	return NextResponse.json({ success: true });
}


