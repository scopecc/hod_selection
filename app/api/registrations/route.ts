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

	// Ensure totalSlots = fnSlots + anSlots and sanitize types
	const normalizedEntries = entries.map((e: any) => {
		const fnSlots = Number(e.fnSlots || 0);
		const anSlots = Number(e.anSlots || 0);
		return {
			courseCode: String(e.courseCode || ''),
			courseName: String(e.courseName || ''),
			credits: Number(e.credits || 0),
			group: String(e.group || ''),
			studentStrength: Number(e.studentStrength || 0),
			fnSlots,
			anSlots,
			totalSlots: fnSlots + anSlots,
			facultySchool: String(e.facultySchool || ''),
			batch: String(e.batch || ''),
			prerequisites: Array.isArray(e.prerequisites) ? e.prerequisites.map(String) : []
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
			JSON.stringify(a.prerequisites) === JSON.stringify(b.prerequisites);
	}

	// Merge logic: for each new entry, update if differs, add if not exists
	const upsertEntries = (sourceEntries: any[]) => {
		for (const entry of sourceEntries) {
			const idx = mergedEntries.findIndex((e: any) => e.courseCode === entry.courseCode);
			if (idx === -1) {
				mergedEntries.push(entry);
			} else if (!entriesEqual(mergedEntries[idx], entry)) {
				mergedEntries[idx] = entry;
			}
			// else identical, skip
		}
	};

	upsertEntries(normalizedEntries);
	const userDraft = await db.collection('user_drafts').findOne({ draftId, userId });
	if (userDraft?.entries) {
		upsertEntries(userDraft.entries);
	}

	await db.collection('registrations').updateOne(
		{ draftId, userId },
		{ $set: { draftId, userId, userName, department, programme, entries: mergedEntries, status: status || 'draft', updatedAt: now, createdAt: existingReg?.createdAt || now } },
		{ upsert: true }
	);
	return NextResponse.json({ success: true });
}


