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

	// Fetch user's programme from VIT_Auth
	const userDoc = await db.collection('VIT_Auth').findOne({ employeeId: userId });
	const programme = userDoc?.programme || '';

	// Use L, T, P, J values from the request body (frontend)
	const normalizedEntries = entries.map((e: any) => {
		const fnSlots = Number(e.fnSlots || 0);
		const anSlots = Number(e.anSlots || 0);
		const creditsNum = Number(e.credits || 0);
		return {
			courseCode: String(e.courseCode || ''),
			courseName: String(e.courseName || ''),
			credits: creditsNum,
			group: String(e.group || ''),
			studentStrength: Number(e.studentStrength || 0),
			fnSlots,
			anSlots,
			totalSlots: fnSlots + anSlots,
			studentsPerSlot: typeof e.studentsPerSlot !== 'undefined' ? Number(e.studentsPerSlot) : '',
			facultySchool: String(e.facultySchool || ''),
			batch: String(e.batch || ''),
			prerequisites: Array.isArray(e.prerequisites) ? e.prerequisites.map(String) : [],
			basket: String(e.basket || ''),
			remarks: String(e.remarks || ''),
			L: typeof e.L !== 'undefined' ? e.L : '-',
			T: typeof e.T !== 'undefined' ? e.T : '-',
			P: typeof e.P !== 'undefined' ? e.P : '-',
			J: typeof e.J !== 'undefined' ? e.J : '-',
		};
	});

	// Fetch existing registration
	const existingReg = await db.collection('registrations').findOne({ draftId, userId });
	let mergedEntries = existingReg?.entries ? [...existingReg.entries] : [];

	// Helper to compare two entries deeply
	function entriesEqual(a: any, b: any) {
		return a.courseCode === b.courseCode &&
			a.courseName === b.courseName &&
			a.credits === b.credits &&
			a.group === b.group &&
			a.studentStrength === b.studentStrength &&
			a.fnSlots === b.fnSlots &&
			a.anSlots === b.anSlots &&
			a.totalSlots === b.totalSlots &&
			a.facultySchool === b.facultySchool &&
			a.batch === b.batch &&
			JSON.stringify(a.prerequisites) === JSON.stringify(b.prerequisites) &&
			a.L === b.L &&
			a.T === b.T &&
			a.P === b.P &&
			a.J === b.J;
	}

	// Overwrite entries with the new array from the frontend (no merging)
	mergedEntries = normalizedEntries;

	await db.collection('registrations').updateOne(
		{ draftId, userId },
		{ $set: { draftId, userId, userName, department, programme, entries: mergedEntries, status: status || 'draft', updatedAt: now, createdAt: existingReg?.createdAt || now } },
		{ upsert: true }
	);
	return NextResponse.json({ success: true });
}


