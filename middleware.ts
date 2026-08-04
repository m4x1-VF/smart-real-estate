import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { loginRateLimit, signupRateLimit } from '@/lib/rate-limit';
import { verifyTurnstileToken } from '@/lib/turnstile';

/**
 * Extracts the client IP address from the request.
 * Uses x-forwarded-for (most common), x-real-ip, or falls back to unknown.
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs; take the first (client's)
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Checks if the request is a POST to an auth sign-in or sign-up endpoint.
 * Returns null for social auth endpoints (OAuth flows) — those are handled
 * by the provider and should not be rate-limited or gated by Turnstile.
 */
function getAuthEndpointType(
  request: NextRequest
): 'login' | 'signup' | null {
  if (request.method !== 'POST') return null;
  const { pathname } = request.nextUrl;

  // Social auth endpoints — skip rate limiting and Turnstile
  if (pathname.startsWith('/api/auth/sign-in/social')) return null;
  if (pathname.startsWith('/api/auth/callback/')) return null;

  if (pathname.startsWith('/api/auth/sign-in/')) return 'login';
  if (pathname.startsWith('/api/auth/sign-up/')) return 'signup';
  return null;
}

export async function middleware(request: NextRequest) {
  // --- Auth gate (session cookie check) ---
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

  // --- Rate limiting + Turnstile for auth endpoints ---
  const authEndpoint = getAuthEndpointType(request);

  if (authEndpoint) {
    const clientIP = getClientIP(request);

    // 1. Rate limiting (skip if Redis is not configured)
    const rateLimiter =
      authEndpoint === 'login' ? loginRateLimit : signupRateLimit;

    if (rateLimiter) {
      try {
        const result = await rateLimiter.limit(clientIP);
        if (!result.success) {
          return NextResponse.json(
            { error: 'Too many attempts. Please try again later.' },
            { status: 429 }
          );
        }
      } catch (error) {
        // Fail-open: allow the request if Redis is unreachable
        console.error('[Rate Limit] Redis error (fail-open):', error);
      }
    }

    // 2. Turnstile verification
    const turnstileToken = request.headers.get('x-turnstile-token');

    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Security verification required.' },
        { status: 403 }
      );
    }

    const tokenValid = await verifyTurnstileToken(turnstileToken);
    if (!tokenValid) {
      return NextResponse.json(
        { error: 'Security verification failed. Please try again.' },
        { status: 403 }
      );
    }
  }

  // --- CSP (Content Security Policy) ---
  // Generate cryptographic nonce per request for CSP (Edge Runtime compatible)
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));

  // React requires 'unsafe-eval' in development for debugging features (callstacks, HMR)
  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://challenges.cloudflare.com`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`;

  const cspHeader = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' https://res.cloudinary.com https://images.unsplash.com https://images.pexels.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.tile.openstreetmap.org data:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://sjlojbdoihgappqtmads.supabase.co`,
    `frame-src 'self' https://challenges.cloudflare.com`,
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
