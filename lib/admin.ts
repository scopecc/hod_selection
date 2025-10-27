import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.NEXTAUTH_SECRET || 'dev-admin-secret';

export function validateAdminCredentials(username: string, password: string): boolean {
	return username === ADMIN_USERNAME && password === ADMIN_PASSWORD && ADMIN_USERNAME.length > 0;
}

export function createAdminSessionToken(): string {
	const payload = JSON.stringify({ role: 'admin', iat: Date.now() });
	const hmac = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
	const token = Buffer.from(`${payload}.${hmac}`).toString('base64url');
	return token;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
	if (!token) return false;
	try {
		const decoded = Buffer.from(token, 'base64url').toString('utf8');
		const [payload, sig] = decoded.split('.');
		const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
		if (sig !== expected) return false;
		const data = JSON.parse(payload);
		return data.role === 'admin';
	} catch {
		return false;
	}
}

export function requireAdminFromRequest(req: Request): boolean {
	const cookieHeader = req.headers.get('cookie') || '';
	const match = cookieHeader.match(/(?:^|; )admin_session=([^;]+)/);
	const token = match ? decodeURIComponent(match[1]) : null;
	return verifyAdminSessionToken(token);
}

export function setAdminSessionCookie(): void {
	const token = createAdminSessionToken();
	// In production we need the cookie scoped to the main domain with Secure and
	// SameSite=None for cross-site usage (if any). For local development we
	// omit the domain and relax sameSite/secure so the cookie works on
	// localhost without HTTPS.
	const opts: any = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 60 * 60 * 8,
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
	};
	if (process.env.NODE_ENV === 'production') {
		opts.domain = '.scopevitcc.in';
	}
	cookies().set('admin_session', token, opts);
}

export function clearAdminSessionCookie(): void {
	const opts: any = { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0, sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' };
	if (process.env.NODE_ENV === 'production') opts.domain = '.scopevitcc.in';
	cookies().set('admin_session', '', opts);
}

export function isAdminFromCookies(): boolean {
	const token = cookies().get('admin_session')?.value;
	const isValid = verifyAdminSessionToken(token);
	return isValid;
}


