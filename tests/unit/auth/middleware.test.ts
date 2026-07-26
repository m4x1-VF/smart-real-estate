import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock better-auth/cookies
const getSessionCookieMock = vi.fn();
vi.mock('better-auth/cookies', () => ({
  getSessionCookie: (...args: unknown[]) => getSessionCookieMock(...args),
}));

function createRequest(pathname: string): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000');
  return new NextRequest(url);
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
});
