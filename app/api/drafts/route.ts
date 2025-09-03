import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
	const db = await getDatabase();
	const drafts = await db.collection('drafts').find({}).project({ courses: 0 }).sort({ createdAt: -1 }).toArray();
	const openDrafts = drafts.filter((d: any) => d.status === 'open');
	return NextResponse.json({ drafts: openDrafts });
}


