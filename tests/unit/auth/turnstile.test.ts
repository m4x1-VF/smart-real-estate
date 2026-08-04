import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only (no-op)
vi.mock('server-only', () => ({}));

describe('lib/turnstile — verifyTurnstileToken', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.TURNSTILE_SECRET_KEY = 'test-secret-key';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it('returns true when Cloudflare responds with success: true', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { verifyTurnstileToken } = await import('@/lib/turnstile');
    const result = await verifyTurnstileToken('valid-token');

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns false when Cloudflare responds with success: false', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { verifyTurnstileToken } = await import('@/lib/turnstile');
    const result = await verifyTurnstileToken('invalid-token');

    expect(result).toBe(false);
  });

  it('returns false when the Cloudflare API returns a non-OK HTTP status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    vi.stubGlobal('fetch', fetchMock);

    const { verifyTurnstileToken } = await import('@/lib/turnstile');
    const result = await verifyTurnstileToken('some-token');

    expect(result).toBe(false);
  });

  it('returns false when fetch throws a network error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);

    const { verifyTurnstileToken } = await import('@/lib/turnstile');
    const result = await verifyTurnstileToken('some-token');

    expect(result).toBe(false);
  });

  it('returns true when TURNSTILE_SECRET_KEY is not set (fail-open in development)', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    const { verifyTurnstileToken } = await import('@/lib/turnstile');
    const result = await verifyTurnstileToken('any-token');

    expect(result).toBe(true);
  });
});
