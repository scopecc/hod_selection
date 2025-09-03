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
    
    console.log('[DEBUG][Middleware] Admin route:', pathname);
    console.log('[DEBUG][Middleware] Is login page:', isLoginPage);
    console.log('[DEBUG][Middleware] Admin cookie exists:', !!adminCookie);
    console.log('[DEBUG][Middleware] Is authenticated:', isAuthed);

    if (!isAuthed && !isLoginPage) {
      console.log('[DEBUG][Middleware] Redirecting to admin login');
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '';
      return NextResponse.redirect(url);
    }

    if (isAuthed && isLoginPage) {
      console.log('[DEBUG][Middleware] Redirecting to admin dashboard');
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect user registration route with NextAuth JWT
  if (pathname.startsWith('/registration') || pathname.startsWith('/dashboard')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.search = '';
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
    '/dashboard',
  ],
};