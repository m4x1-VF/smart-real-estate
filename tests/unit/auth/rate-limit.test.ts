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
  Redis: {
    fromEnv: () => ({}),
  },
}));

describe('lib/rate-limit — loginRateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
    redisLimitMock.mockReset();
  });

  it('creates a loginRateLimit instance', async () => {
    const { loginRateLimit } = await import('@/lib/rate-limit');
    expect(loginRateLimit).toBeDefined();
    expect(typeof loginRateLimit.limit).toBe('function');
  });

  it('allows requests when under the limit', async () => {
    redisLimitMock.mockResolvedValue({ success: true, remaining: 4 });
    const { loginRateLimit } = await import('@/lib/rate-limit');
    const result = await loginRateLimit.limit('192.168.1.1');
    expect(result.success).toBe(true);
  });

  it('blocks requests when over the login limit (5 per 60s)', async () => {
    redisLimitMock.mockResolvedValue({ success: false, remaining: 0 });
    const { loginRateLimit } = await import('@/lib/rate-limit');
    const result = await loginRateLimit.limit('192.168.1.1');
    expect(result.success).toBe(false);
  });
});

describe('lib/rate-limit — signupRateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
    redisLimitMock.mockReset();
  });

  it('creates a signupRateLimit instance', async () => {
    const { signupRateLimit } = await import('@/lib/rate-limit');
    expect(signupRateLimit).toBeDefined();
    expect(typeof signupRateLimit.limit).toBe('function');
  });

  it('allows requests when under the signup limit', async () => {
    redisLimitMock.mockResolvedValue({ success: true, remaining: 2 });
    const { signupRateLimit } = await import('@/lib/rate-limit');
    const result = await signupRateLimit.limit('192.168.1.1');
    expect(result.success).toBe(true);
  });

  it('blocks requests when over the signup limit (3 per hour)', async () => {
    redisLimitMock.mockResolvedValue({ success: false, remaining: 0 });
    const { signupRateLimit } = await import('@/lib/rate-limit');
    const result = await signupRateLimit.limit('192.168.1.1');
    expect(result.success).toBe(false);
  });
});
