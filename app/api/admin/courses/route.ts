import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/admin';

// Simple CSV parsing for Course Code, Course Name, Credits
function parseCSV(text: string): { courseCode: string; courseName: string; credits: number }[] {
	const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
	const rows = [] as { courseCode: string; courseName: string; credits: number }[];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const cells = line.split(',').map(c => c.trim());
		if (i === 0 && /course\s*code/i.test(cells[0])) continue; // skip header
		if (cells.length < 3) continue;
		const [courseCode, courseName, creditsStr] = cells;
		const credits = Number(creditsStr);
		if (!courseCode || !courseName || Number.isNaN(credits)) continue;
		rows.push({ courseCode, courseName, credits });
	}
	return rows;
}

export async function POST(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const draftId = searchParams.get('draftId');
	if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });
	const contentType = req.headers.get('content-type') || '';
	let rows: { courseCode: string; courseName: string; credits: number }[] = [];
	if (contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
		const text = await req.text();
		rows = parseCSV(text);
	} else if (contentType.includes('application/json')) {
		const json = await req.json();
		rows = Array.isArray(json) ? json : [];
	} else {
		return NextResponse.json({ error: 'Unsupported content-type' }, { status: 415 });
	}
	if (!rows.length) return NextResponse.json({ error: 'No rows parsed' }, { status: 400 });
	const db = await getDatabase();
	await db.collection('courses').deleteMany({ draftId });
	await db.collection('courses').insertMany(rows.map(r => ({ ...r, draftId })));
	return NextResponse.json({ success: true, count: rows.length });
}

export async function DELETE(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const draftId = searchParams.get('draftId');
	if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });
	const db = await getDatabase();
	await db.collection('courses').deleteMany({ draftId });
	return NextResponse.json({ success: true });
}


