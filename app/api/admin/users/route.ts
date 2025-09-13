import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/admin';

const COLLECTION = 'VIT_Auth';

export async function GET(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const db = await getDatabase();
	const users = await db.collection(COLLECTION).find({}).project({ _id: 0 }).toArray();
	return NextResponse.json({ users });
}

export async function POST(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const body = await req.json();
	const { name, employeeId, email, department } = body || {};
	if (!name || !employeeId || !email || !department) {
		return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
	}
	const db = await getDatabase();
	const now = new Date();
	await db.collection(COLLECTION).updateOne(
		{ employeeId },
		{ $set: { name, employeeId, email, department, updatedAt: now, createdAt: now } },
		{ upsert: true }
	);
	return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const body = await req.json();
	const { employeeId, name, email, department, ...updates } = body || {};
	if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
	const db = await getDatabase();
	// Update user in VIT_Auth
	await db.collection(COLLECTION).updateOne({ employeeId }, { $set: { ...updates, name, email, department } });

	// Also update name/email/department in registrations and user_drafts
	if (name || email || department) {
		const regUpdate: any = {};
		if (name) regUpdate.userName = name;
		if (department) regUpdate.department = department;
		await db.collection('registrations').updateMany(
			{ userId: employeeId },
			{ $set: regUpdate }
		);
		await db.collection('user_drafts').updateMany(
			{ userId: employeeId },
			{ $set: regUpdate }
		);
	}
	return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
	if (!requireAdminFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const employeeId = searchParams.get('employeeId');
	if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
	const db = await getDatabase();
	await db.collection(COLLECTION).deleteOne({ employeeId });
	return NextResponse.json({ success: true });
}


