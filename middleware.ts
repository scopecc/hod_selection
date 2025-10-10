import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// use server-side session check via internal API instead of getToken in Edge

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
    // Call internal NextAuth session endpoint, forwarding cookies, so the
    // validation is performed in the server runtime that has access to the
    // NEXTAUTH_SECRET. This avoids requiring the Edge runtime to have the
    // secret available.
    let session: any = null;
    try {
      const origin = req.nextUrl.origin || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      const resp = await fetch(`${origin}/api/auth/session`, {
        method: 'GET',
        headers: {
          // forward cookies so the session endpoint can read the token
          cookie: req.headers.get('cookie') || ''
        }
      });
      if (resp.ok) {
        try {
          session = await resp.json();
        } catch (e) {
          session = null;
        }
      }
    } catch (e) {
      // network or other error - treat as missing session
      session = null;
    }

    // Optional debug logging when DEBUG_MIDDLEWARE=true in env
    try {
      if (process.env.DEBUG_MIDDLEWARE === 'true') {
        console.log('middleware: /registration session ->', Boolean(session));
        if (session && session.user) {
          console.log('middleware session user:', session.user.id || session.user.name || session.user.email || null);
        }
      }
    } catch (e) {
      // ignore logging errors
    }

    if (!session || !session.user) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
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