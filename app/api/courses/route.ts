import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const draftId = searchParams.get('draftId');
	if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });
	const db = await getDatabase();
	const courses = await db.collection('courses').find({ draftId }).project({ _id: 0 }).toArray();
	return NextResponse.json({ courses });
}


