import { NextResponse } from 'next/server';
import { setAdminSessionCookie, validateAdminCredentials, clearAdminSessionCookie } from '@/lib/admin';

export async function POST(req: Request) {
	const { username, password } = await req.json();
	if (!username || !password) {
		return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
	}
	const ok = validateAdminCredentials(username, password);
	if (!ok) {
		return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
	}
	setAdminSessionCookie();
	return NextResponse.json({ success: true });
}

export async function DELETE() {
	clearAdminSessionCookie();
	return NextResponse.json({ success: true });
}


