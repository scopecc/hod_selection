import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/admin';
import { Draft } from '@/types/models';
import { ObjectId } from 'mongodb';

const COLLECTION = 'drafts';

export async function GET(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const db = await getDatabase();
	const drafts = await db.collection<Draft>(COLLECTION as any).find({}).sort({ createdAt: -1 }).toArray();
	return NextResponse.json({ drafts });
}

export async function POST(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const body = await req.json();
	const { name, yearStart, yearEnd } = body || {};
	if (!name || !yearStart || !yearEnd) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
	const db = await getDatabase();
	// Check for duplicate draft name
	const existing = await db.collection(COLLECTION).findOne({ name });
	if (existing) {
		return NextResponse.json({ error: 'Draft with this name already exists' }, { status: 409 });
	}
	const now = new Date();
	const draft: Draft = { 
		name, 
		yearStart: new Date(yearStart, 0, 1), // January 1st of the year
		yearEnd: new Date(yearEnd, 11, 31), // December 31st of the year
		status: 'open', 
		createdAt: now, 
		updatedAt: now 
	};
	await db.collection(COLLECTION).insertOne(draft as any);
	return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const body = await req.json();
	const { id, status, name, yearStart, yearEnd } = body || {};
	if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
	const db = await getDatabase();
	const updates: any = { updatedAt: new Date() };
	if (status) updates.status = status;
	if (name) updates.name = name;
	if (yearStart) updates.yearStart = new Date(yearStart, 0, 1);
	if (yearEnd) updates.yearEnd = new Date(yearEnd, 11, 31);
	const _id = (() => {
		try { return new ObjectId(id); } catch { return id; }
	})();
	await db.collection(COLLECTION).updateOne({ _id }, { $set: updates });
	return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const id = searchParams.get('id');
	if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
	const db = await getDatabase();
	const _id = (() => { try { return new ObjectId(id); } catch { return id; }})();
	await db.collection(COLLECTION).deleteOne({ _id: _id as any });
	await db.collection('courses').deleteMany({ draftId: id });
	await db.collection('registrations').deleteMany({ draftId: id });
	return NextResponse.json({ success: true });
}


