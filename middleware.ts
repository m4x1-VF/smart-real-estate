import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isProfileRoute = request.nextUrl.pathname.startsWith('/profile');
  const isSavedRoute = request.nextUrl.pathname.startsWith('/saved');
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup');

  if (!sessionCookie && (isAdminRoute || isProfileRoute || isSavedRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (sessionCookie && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Generate cryptographic nonce per request for CSP (Edge Runtime compatible)
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));

  // React requires 'unsafe-eval' in development for debugging features (callstacks, HMR)
  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const cspHeader = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' https://res.cloudinary.com https://images.unsplash.com https://images.pexels.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.tile.openstreetmap.org data:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://sjlojbdoihgappqtmads.supabase.co`,
    `frame-ancestors 'none'`,
  ].join('; ');

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
