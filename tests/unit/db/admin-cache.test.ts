import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
}));

vi.mock('server-only', () => ({}));

// Track cache invocations
let cacheCallCount = 0;
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => {
      // Simple memoization by first arg to simulate React cache() behavior
      const memo = new Map<string, Promise<unknown>>();
      const cached = ((...args: unknown[]) => {
        cacheCallCount++;
        const key = JSON.stringify(args);
        if (!memo.has(key)) {
          memo.set(key, fn(...args));
        }
        return memo.get(key);
      }) as T;
      return cached;
    },
  };
});

vi.mock('@/lib/db/client', () => ({
  getDb: () => mocks.sql,
}));

describe('isAdmin cache deduplication (T10 → R3)', () => {
  beforeEach(() => {
    mocks.sql.mockReset();
    cacheCallCount = 0;
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deduplicates calls with the same userId within a request lifecycle', async () => {
    mocks.sql.mockResolvedValue([{ one: 1 }]);

    const { isAdmin } = await import('@/lib/db/admin');

    // Call twice with the same userId (simulating layout + page)
    const result1 = await isAdmin('user-admin-1');
    const result2 = await isAdmin('user-admin-1');

    expect(result1).toBe(true);
    expect(result2).toBe(true);
    // The underlying SQL should only be called once due to cache()
    expect(mocks.sql).toHaveBeenCalledTimes(1);
  });

  it('makes separate DB calls for different userIds', async () => {
    mocks.sql.mockResolvedValue([{ one: 1 }]);

    const { isAdmin } = await import('@/lib/db/admin');

    await isAdmin('user-admin-1');
    await isAdmin('user-admin-2');

    // Different userIds → 2 separate queries
    expect(mocks.sql).toHaveBeenCalledTimes(2);
  });
});
