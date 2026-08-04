import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock better-auth/cookies
const getSessionCookieMock = vi.fn();
vi.mock('better-auth/cookies', () => ({
  getSessionCookie: (...args: unknown[]) => getSessionCookieMock(...args),
}));

// Mock server-only (no-op)
vi.mock('server-only', () => ({}));

// Mock rate limiters
vi.mock('@/lib/rate-limit', () => ({
  loginRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true, remaining: 5 }),
  },
  signupRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true, remaining: 3 }),
  },
}));

// Mock turnstile verification
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstileToken: vi.fn().mockResolvedValue(true),
}));

function createRequest(pathname: string): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000');
  return new NextRequest(url);
}

// --- T4: Static security headers from next.config.ts ---

describe('next.config.ts — static security headers', () => {
  it('returns headers() with all required security headers for catch-all route', async () => {
    const config = (await import('@/next.config.ts')).default;
    const headersFn = config.headers;
    expect(headersFn).toBeDefined();

    const rules = await headersFn!();
    const catchAll = rules.find((r) => r.source === '/(.*)');
    expect(catchAll).toBeDefined();

    const headerMap = new Map(
      catchAll!.headers.map((h) => [h.key, h.value])
    );

    expect(headerMap.get('X-Frame-Options')).toBe('DENY');
    expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headerMap.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    );
    expect(headerMap.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=()'
    );
  });

  it('sets HSTS with max-age >= 63072000, includeSubDomains, and preload', async () => {
    const config = (await import('@/next.config.ts')).default;
    const rules = await config.headers!();
    const catchAll = rules.find((r) => r.source === '/(.*)');
    const hsts = catchAll!.headers.find(
      (h) => h.key === 'Strict-Transport-Security'
    );

    expect(hsts).toBeDefined();
    expect(hsts!.value).toContain('includeSubDomains');
    expect(hsts!.value).toContain('preload');

    const maxAgeMatch = hsts!.value.match(/max-age=(\d+)/);
    expect(maxAgeMatch).not.toBeNull();
    expect(Number(maxAgeMatch![1])).toBeGreaterThanOrEqual(63072000);
  });
});

// --- T5: CSP nonce from middleware ---

describe('middleware — CSP nonce', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionCookieMock.mockReset();
    getSessionCookieMock.mockReturnValue(null);
  });

  it('sets Content-Security-Policy header with nonce', async () => {
    const { middleware } = await import('@/middleware');
    const request = createRequest('/');
    const response = await middleware(request);

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).not.toBeNull();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('nonce-');
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(csp).toContain('https://res.cloudinary.com');
    expect(csp).toContain('https://sjlojbdoihgappqtmads.supabase.co');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('generates different nonces for different requests', async () => {
    const { middleware } = await import('@/middleware');
    const request1 = createRequest('/');
    const request2 = createRequest('/');

    const response1 = await middleware(request1);
    const response2 = await middleware(request2);

    const csp1 = response1.headers.get('Content-Security-Policy')!;
    const csp2 = response2.headers.get('Content-Security-Policy')!;

    const nonce1 = csp1.match(/'nonce-([^']+)'/)![1];
    const nonce2 = csp2.match(/'nonce-([^']+)'/)![1];

    expect(nonce1).not.toBe(nonce2);
  });

  it('includes unsafe-eval in script-src during development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    vi.resetModules();

    const { middleware } = await import('@/middleware');
    const request = createRequest('/');
    const response = await middleware(request);

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain("'unsafe-eval'");

    process.env.NODE_ENV = originalEnv;
  });

  it('excludes unsafe-eval in script-src during production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    vi.resetModules();

    const { middleware } = await import('@/middleware');
    const request = createRequest('/');
    const response = await middleware(request);

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).not.toContain("'unsafe-eval'");

    process.env.NODE_ENV = originalEnv;
  });
});

// --- T6: Cache-Control for /admin/* routes ---

describe('next.config.ts — Cache-Control for admin routes', () => {
  it('sets Cache-Control: no-store, private for /admin/:path*', async () => {
    const config = (await import('@/next.config.ts')).default;
    const rules = await config.headers!();
    const adminRule = rules.find((r) => r.source === '/admin/:path*');

    expect(adminRule).toBeDefined();
    const cacheControl = adminRule!.headers.find(
      (h) => h.key === 'Cache-Control'
    );
    expect(cacheControl).toBeDefined();
    expect(cacheControl!.value).toBe('no-store, private');
  });
});
