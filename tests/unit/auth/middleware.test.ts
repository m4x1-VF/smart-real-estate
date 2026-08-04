import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock better-auth/cookies
const getSessionCookieMock = vi.fn();
vi.mock('better-auth/cookies', () => ({
  getSessionCookie: (...args: unknown[]) => getSessionCookieMock(...args),
}));

// Mock server-only (no-op)
vi.mock('server-only', () => ({}));

// Mock rate limiters (fail-open by default — allow all)
vi.mock('@/lib/rate-limit', () => ({
  loginRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true, remaining: 5 }),
  },
  signupRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true, remaining: 3 }),
  },
}));

// Mock turnstile verification (always passes by default)
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstileToken: vi.fn().mockResolvedValue(true),
}));

function createRequest(pathname: string, options?: { method?: string; headers?: Record<string, string> }): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000');
  const init: RequestInit = {
    method: options?.method ?? 'GET',
  };
  if (options?.headers) {
    init.headers = new Headers(options.headers);
  }
  return new NextRequest(url, init);
}

describe('middleware — auth gate', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionCookieMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects /admin/* to /login when no session cookie exists', async () => {
    getSessionCookieMock.mockReturnValue(null);
    const { middleware } = await import('@/middleware');
    const request = createRequest('/admin/properties');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('allows access to /admin/* when a valid session cookie exists', async () => {
    getSessionCookieMock.mockReturnValue('valid-session-token');
    const { middleware } = await import('@/middleware');
    const request = createRequest('/admin/properties');
    const response = await middleware(request);

    // NextResponse.next() returns a 200 with x-middleware-next header
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects /login to / when a valid session cookie exists', async () => {
    getSessionCookieMock.mockReturnValue('valid-session-token');
    const { middleware } = await import('@/middleware');
    const request = createRequest('/login');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/');
  });

  it('allows access to /login when no session cookie exists', async () => {
    getSessionCookieMock.mockReturnValue(null);
    const { middleware } = await import('@/middleware');
    const request = createRequest('/login');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows access to public routes regardless of session', async () => {
    getSessionCookieMock.mockReturnValue(null);
    const { middleware } = await import('@/middleware');
    const request = createRequest('/');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects /signup to / when a valid session cookie exists', async () => {
    getSessionCookieMock.mockReturnValue('valid-session-token');
    const { middleware } = await import('@/middleware');
    const request = createRequest('/signup');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/');
  });

  it('allows access to /signup when no session cookie exists', async () => {
    getSessionCookieMock.mockReturnValue(null);
    const { middleware } = await import('@/middleware');
    const request = createRequest('/signup');
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});

describe('middleware — CSP includes Cloudflare Turnstile', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionCookieMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes challenges.cloudflare.com in script-src', async () => {
    getSessionCookieMock.mockReturnValue(null);
    const { middleware } = await import('@/middleware');
    const request = createRequest('/');
    const response = await middleware(request);
    const csp = response.headers.get('Content-Security-Policy') ?? '';

    expect(csp).toContain('https://challenges.cloudflare.com');
  });

  it('includes frame-src directive for Cloudflare Turnstile', async () => {
    getSessionCookieMock.mockReturnValue(null);
    const { middleware } = await import('@/middleware');
    const request = createRequest('/');
    const response = await middleware(request);
    const csp = response.headers.get('Content-Security-Policy') ?? '';

    expect(csp).toMatch(/frame-src.*challenges\.cloudflare\.com/);
  });
});
