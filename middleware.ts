import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes with custom admin session cookie
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const adminCookie = req.cookies.get('admin_session')?.value;
    const isAuthed = adminCookie && adminCookie.length > 0;
    


    if (!isAuthed && !isLoginPage) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '';
      return NextResponse.redirect(url);
    }

    if (isAuthed && isLoginPage) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect user registration route with NextAuth JWT
  if (pathname.startsWith('/registration')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Optional debug logging when DEBUG_MIDDLEWARE=true in env
    try {
      if (process.env.DEBUG_MIDDLEWARE === 'true') {
        // Log minimal info - avoid sensitive payloads
        console.log('middleware: /registration getToken ->', Boolean(token));
        if (token) {
          console.log('middleware token id:', (token as any).sub || (token as any).id || null);
          console.log('middleware token role:', (token as any).role || null);
        }
      }
    } catch (e) {
      // ignore logging errors
    }

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      // attach a short code so the client can show a helpful message (no secrets)
      try {
        url.searchParams.set('auth_error', 'token_missing');
      } catch (e) {
        url.search = '?auth_error=token_missing';
      }
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/registration',
  ],
};