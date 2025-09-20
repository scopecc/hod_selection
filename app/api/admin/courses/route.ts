import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/admin';

// CSV parsing for Course Code, Course Name, Credits, Group, L, T, P, J
function parseCSV(text: string): { courseCode: string; courseName: string; credits: number; group?: string; L?: number; T?: number; P?: number; J?: number }[] {
	const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
	const rows = [] as { courseCode: string; courseName: string; credits: number; group?: string; L?: number; T?: number; P?: number; J?: number }[];
	let header: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const cells = line.split(',').map(c => c.trim());
		if (i === 0) { header = cells.map(h => h.toLowerCase()); continue; }
		if (cells.length < 3) continue;
		const get = (name: string) => {
			const idx = header.findIndex(h => h === name.toLowerCase());
			return idx >= 0 ? cells[idx] : '';
		};
		const courseCode = get('course code') || get('code') || get('coursecode');
		const courseName = get('course name') || get('name') || get('coursename');
		const credits = Number(get('credits') || get('credit') || get('credits'));
		const group = get('group');
		const L = Number(get('l'));
		const T = Number(get('t'));
		const P = Number(get('p'));
		const J = Number(get('j'));
		if (!courseCode || !courseName || Number.isNaN(credits)) continue;
		const row: any = { courseCode, courseName, credits, group };
		if (!Number.isNaN(L)) row.L = L;
		if (!Number.isNaN(T)) row.T = T;
		if (!Number.isNaN(P)) row.P = P;
		if (!Number.isNaN(J)) row.J = J;
		rows.push(row);
	}
	return rows;
}

export async function POST(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const draftId = searchParams.get('draftId');
	if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });

	// Accept multipart/form-data (file input), CSV text, or binary Excel
	const contentType = req.headers.get('content-type') || '';
	let rows: { courseCode: string; courseName: string; credits: number; group?: string }[] = [];
	if (contentType.includes('multipart/form-data')) {
		const formData = await req.formData();
		const file = formData.get('file');
		if (!file || !(file instanceof Blob)) return NextResponse.json({ error: 'file required' }, { status: 400 });
		const arrayBuffer = await file.arrayBuffer();
		const XLSX: any = await import('xlsx');
		const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
		const sheetName = workbook.SheetNames[0];
		const json: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
		rows = json.map((r: any) => {
			const courseCode = String(r['Course Code'] ?? r['Code'] ?? r['courseCode'] ?? '').trim();
			const courseName = String(r['Course Name'] ?? r['Name'] ?? r['courseName'] ?? '').trim();
			const credits = Number(r['Credits'] ?? r['Credit'] ?? r['credits'] ?? 0);
			const group = String(r['Group'] ?? r['group'] ?? '').trim();
			const L = Number(r['L'] ?? r['l']);
			const T = Number(r['T'] ?? r['t']);
			const P = Number(r['P'] ?? r['p']);
			const J = Number(r['J'] ?? r['j']);
			const row: any = { courseCode, courseName, credits, group };
			if (!Number.isNaN(L)) row.L = L;
			if (!Number.isNaN(T)) row.T = T;
			if (!Number.isNaN(P)) row.P = P;
			if (!Number.isNaN(J)) row.J = J;
			return row;
		}).filter(r => r.courseCode && r.courseName && Number.isFinite(r.credits));
	} else if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || contentType.includes('application/vnd.ms-excel')) {
		const buffer = new Uint8Array(await req.arrayBuffer());
		const XLSX: any = await import('xlsx');
		const workbook = XLSX.read(buffer, { type: 'array' });
		const sheetName = workbook.SheetNames[0];
		rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }) as any;
		rows = rows.map((r: any) => {
			const courseCode = String(r['Course Code'] ?? r['Code'] ?? r['courseCode'] ?? '').trim();
			const courseName = String(r['Course Name'] ?? r['Name'] ?? r['courseName'] ?? '').trim();
			const credits = Number(r['Credits'] ?? r['Credit'] ?? r['credits'] ?? 0);
			const group = String(r['Group'] ?? r['group'] ?? '').trim();
			const L = Number(r['L'] ?? r['l']);
			const T = Number(r['T'] ?? r['t']);
			const P = Number(r['P'] ?? r['p']);
			const J = Number(r['J'] ?? r['j']);
			const row: any = { courseCode, courseName, credits, group };
			if (!Number.isNaN(L)) row.L = L;
			if (!Number.isNaN(T)) row.T = T;
			if (!Number.isNaN(P)) row.P = P;
			if (!Number.isNaN(J)) row.J = J;
			return row;
		}).filter(r => r.courseCode && r.courseName && Number.isFinite(r.credits));
	} else if (contentType.includes('text/csv')) {
		const text = await req.text();
		rows = parseCSV(text);
	} else if (contentType.includes('application/json')) {
		const json = await req.json();
		rows = Array.isArray(json) ? json : [];
	} else if (contentType.includes('application/octet-stream')) {
		const buffer = new Uint8Array(await req.arrayBuffer());
		try {
			const XLSX: any = await import('xlsx');
			const workbook = XLSX.read(buffer, { type: 'array' });
			const sheetName = workbook.SheetNames[0];
			rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }) as any;
					rows = rows.map((r: any) => {
						const courseCode = String(r['Course Code'] ?? r['Code'] ?? r['courseCode'] ?? '').trim();
						const courseName = String(r['Course Name'] ?? r['Name'] ?? r['courseName'] ?? '').trim();
						const credits = Number(r['Credits'] ?? r['Credit'] ?? r['credits'] ?? 0);
						const group = String(r['Group'] ?? r['group'] ?? '').trim();
						const L = Number(r['L'] ?? r['l']);
						const T = Number(r['T'] ?? r['t']);
						const P = Number(r['P'] ?? r['p']);
						const J = Number(r['J'] ?? r['j']);
						const row: any = { courseCode, courseName, credits, group };
						if (!Number.isNaN(L)) row.L = L;
						if (!Number.isNaN(T)) row.T = T;
						if (!Number.isNaN(P)) row.P = P;
						if (!Number.isNaN(J)) row.J = J;
						return row;
					}).filter(r => r.courseCode && r.courseName && Number.isFinite(r.credits));
		} catch {
			const text = new TextDecoder().decode(buffer);
			rows = parseCSV(text);
		}
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


