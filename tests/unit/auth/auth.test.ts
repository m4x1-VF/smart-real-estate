import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only (no-op)
vi.mock('server-only', () => ({}));

// Mock postgres-js
const postgresMock = vi.fn();
vi.mock('postgres', () => ({
  default: postgresMock,
}));

// Mock kysely-postgres-js with a dialect that satisfies Kysely's full interface
vi.mock('kysely-postgres-js', () => {
  const noop = vi.fn();
  const mockDriver = {
    init: noop,
    acquireConnection: vi.fn().mockResolvedValue({
      executeQuery: vi.fn().mockResolvedValue({ rows: [], numAffectedRows: BigInt(0) }),
      streamQuery: vi.fn(),
      releaseConnection: vi.fn().mockResolvedValue(undefined),
    }),
    beginTransaction: noop,
    commitTransaction: noop,
    rollbackTransaction: noop,
    destroy: noop,
  };
  const mockQueryCompiler = {
    compileQuery: vi.fn().mockReturnValue({ sql: '', parameters: [] }),
    compileInsert: vi.fn().mockReturnValue({ sql: '', parameters: [] }),
    compileUpdate: vi.fn().mockReturnValue({ sql: '', parameters: [] }),
    compileDelete: vi.fn().mockReturnValue({ sql: '', parameters: [] }),
  };
  return {
    PostgresJSDialect: class MockPostgresJSDialect {
      createDriver() {
        return mockDriver;
      }
      createQueryCompiler() {
        return mockQueryCompiler;
      }
      createAdapter() {
        return {};
      }
      createIntrospector() {
        return {
          getSchemas: vi.fn().mockResolvedValue([]),
          getTables: vi.fn().mockResolvedValue([]),
          getMetadata: vi.fn().mockResolvedValue({ tables: [] }),
        };
      }
    },
  };
});

describe('lib/auth/index (better-auth instance)', () => {
  const ORIGINAL_ENV = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    postgresMock.mockReset();
    process.env.DATABASE_URL = 'postgres://user:pass@host/db?sslmode=require';

    const fakeSql = Object.assign(vi.fn(), {
      unsafe: vi.fn(),
      array: vi.fn(),
    });
    postgresMock.mockReturnValue(fakeSql);
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = ORIGINAL_ENV;
    }
    vi.restoreAllMocks();
  });

  it('creates the auth instance without errors using PostgresJSDialect', async () => {
    const { auth } = await import('@/lib/auth');
    expect(auth).toBeDefined();
    expect(typeof auth).toBe('object');
  });

  it('exports an auth object with an api property', async () => {
    const authModule = await import('@/lib/auth');
    expect(authModule.auth).toBeDefined();
    expect(authModule.auth.api).toBeDefined();
    expect(typeof authModule.auth.api.getSession).toBe('function');
  });

  it('reuses the same postgres connection from getDb()', async () => {
    await import('@/lib/db/client');
    const { auth } = await import('@/lib/auth');

    expect(postgresMock).toHaveBeenCalledTimes(1);
    expect(auth).toBeDefined();
  });
});

describe('better-auth/cookies — getSessionCookie', () => {
  it('returns null when no session cookie is present', async () => {
    const { getSessionCookie } = await import('better-auth/cookies');
    const headers = new Headers();
    const result = getSessionCookie(headers);
    expect(result).toBeNull();
  });

  it('returns a string token when a valid session cookie exists', async () => {
    const { getSessionCookie } = await import('better-auth/cookies');
    const headers = new Headers();
    headers.set('cookie', 'better-auth.session_token=fake-session-token-123');
    const result = getSessionCookie(headers);
    expect(result).toBe('fake-session-token-123');
  });
});
