import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const postgresMock = vi.fn();

vi.mock('postgres', () => ({
  default: postgresMock,
}));

describe('lib/db/client (getDb)', () => {
  const ORIGINAL_ENV = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    postgresMock.mockReset();
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = ORIGINAL_ENV;
    }
    vi.restoreAllMocks();
  });

  it('throws when DATABASE_URL is missing', async () => {
    const { getDb } = await import('@/lib/db/client');

    expect(() => getDb()).toThrowError(/DATABASE_URL/);
    expect(postgresMock).not.toHaveBeenCalled();
  });

  it('throws when DATABASE_URL is an empty string', async () => {
    process.env.DATABASE_URL = '';
    const { getDb } = await import('@/lib/db/client');

    expect(() => getDb()).toThrowError(/DATABASE_URL/);
    expect(postgresMock).not.toHaveBeenCalled();
  });

  it('initializes postgres-js once with max=1 and prepare=false', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@host/db?sslmode=require';

    const fakeSql = Object.assign(vi.fn(), {
      unsafe: vi.fn(),
      array: vi.fn(),
    });
    postgresMock.mockReturnValue(fakeSql);

    const { getDb } = await import('@/lib/db/client');

    const a = getDb();
    const b = getDb();

    expect(a).toBe(b);
    expect(postgresMock).toHaveBeenCalledTimes(1);
    expect(postgresMock).toHaveBeenCalledWith(
      'postgres://user:pass@host/db?sslmode=require',
      expect.objectContaining({
        max: 1,
        prepare: false,
      }),
    );
  });
});
