import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only (no-op)
vi.mock('server-only', () => ({}));

// Mock @upstash/redis
const redisLimitMock = vi.fn();
vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    private limitFn: typeof redisLimitMock;

    constructor() {
      this.limitFn = redisLimitMock;
    }

    async limit(id: string) {
      return this.limitFn(id);
    }

    static slidingWindow(_limit: number, _duration: string) {
      return 'sliding-window-limiter';
    }
  }

  return {
    Ratelimit: MockRatelimit,
  };
});

vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor() {}
  },
}));

describe('lib/rate-limit — with Redis configured', () => {
  beforeEach(() => {
    vi.resetModules();
    redisLimitMock.mockReset();
    // Set env vars so rate limiters are created
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
  });

  it('creates a loginRateLimit instance', async () => {
    const { loginRateLimit } = await import('@/lib/rate-limit');
    expect(loginRateLimit).toBeDefined();
    expect(typeof loginRateLimit!.limit).toBe('function');
  });

  it('allows requests when under the limit', async () => {
    redisLimitMock.mockResolvedValue({ success: true, remaining: 4 });
    const { loginRateLimit } = await import('@/lib/rate-limit');
    const result = await loginRateLimit!.limit('192.168.1.1');
    expect(result.success).toBe(true);
  });

  it('blocks requests when over the login limit (5 per 60s)', async () => {
    redisLimitMock.mockResolvedValue({ success: false, remaining: 0 });
    const { loginRateLimit } = await import('@/lib/rate-limit');
    const result = await loginRateLimit!.limit('192.168.1.1');
    expect(result.success).toBe(false);
  });

  it('creates a signupRateLimit instance', async () => {
    const { signupRateLimit } = await import('@/lib/rate-limit');
    expect(signupRateLimit).toBeDefined();
    expect(typeof signupRateLimit!.limit).toBe('function');
  });

  it('allows requests when under the signup limit', async () => {
    redisLimitMock.mockResolvedValue({ success: true, remaining: 2 });
    const { signupRateLimit } = await import('@/lib/rate-limit');
    const result = await signupRateLimit!.limit('192.168.1.1');
    expect(result.success).toBe(true);
  });

  it('blocks requests when over the signup limit (3 per hour)', async () => {
    redisLimitMock.mockResolvedValue({ success: false, remaining: 0 });
    const { signupRateLimit } = await import('@/lib/rate-limit');
    const result = await signupRateLimit!.limit('192.168.1.1');
    expect(result.success).toBe(false);
  });
});

describe('lib/rate-limit — without Redis configured', () => {
  beforeEach(() => {
    vi.resetModules();
    redisLimitMock.mockReset();
    // Unset env vars so rate limiters are null
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  });

  it('returns null for loginRateLimit when Redis is not configured', async () => {
    const { loginRateLimit } = await import('@/lib/rate-limit');
    expect(loginRateLimit).toBeNull();
  });

  it('returns null for signupRateLimit when Redis is not configured', async () => {
    const { signupRateLimit } = await import('@/lib/rate-limit');
    expect(signupRateLimit).toBeNull();
  });
});
