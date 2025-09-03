import { NextResponse } from 'next/server';
import { setAdminSessionCookie, validateAdminCredentials, clearAdminSessionCookie } from '@/lib/admin';

export async function POST(req: Request) {
	const { username, password } = await req.json();
	console.log('[DEBUG][Admin Login] Attempting login for username:', username);
	if (!username || !password) {
		return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
	}
	const ok = validateAdminCredentials(username, password);
	console.log('[DEBUG][Admin Login] Credentials valid:', ok);
	if (!ok) {
		return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
	}
	console.log('[DEBUG][Admin Login] Setting admin session cookie');
	setAdminSessionCookie();
	return NextResponse.json({ success: true });
}

export async function DELETE() {
	clearAdminSessionCookie();
	return NextResponse.json({ success: true });
}


