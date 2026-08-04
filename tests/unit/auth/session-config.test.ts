import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only (no-op)
vi.mock('server-only', () => ({}));

// Mock postgres-js
vi.mock('postgres', () => ({
  default: vi.fn(),
}));

// Mock kysely-postgres-js
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
      createDriver() { return mockDriver; }
      createQueryCompiler() { return mockQueryCompiler; }
      createAdapter() { return {}; }
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

describe('lib/auth — session configuration', () => {
  const ORIGINAL_ENV = process.env.DATABASE_URL;
  let betterAuthOptions: Record<string, unknown> | null = null;

  beforeEach(() => {
    vi.resetModules();
    process.env.DATABASE_URL = 'postgres://user:pass@host/db?sslmode=require';

    const fakeSql = Object.assign(vi.fn(), {
      unsafe: vi.fn(),
      array: vi.fn(),
    });
    const postgresMock = vi.fn().mockReturnValue(fakeSql);
    vi.doMock('postgres', () => ({ default: postgresMock }));

    // Capture the options passed to betterAuth
    vi.doMock('better-auth', () => ({
      betterAuth: (options: Record<string, unknown>) => {
        betterAuthOptions = options;
        return {
          $Infer: { Session: {} },
          api: {
            getSession: vi.fn(),
          },
        };
      },
    }));

    vi.doMock('@better-auth/infra', () => ({
      dash: () => ({}),
    }));

    vi.doMock('@/lib/auth/social-providers', () => ({
      buildSocialProviders: () => ({}),
    }));
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = ORIGINAL_ENV;
    }
    vi.restoreAllMocks();
    betterAuthOptions = null;
  });

  it('configures session.expiresIn to 604800 (7 days)', async () => {
    await import('@/lib/auth');
    expect(betterAuthOptions).not.toBeNull();
    const session = (betterAuthOptions as Record<string, unknown>).session as Record<string, unknown>;
    expect(session).toBeDefined();
    expect(session.expiresIn).toBe(604800);
  });

  it('configures session.updateAge to 900 (15 minutes)', async () => {
    await import('@/lib/auth');
    const session = (betterAuthOptions as Record<string, unknown>).session as Record<string, unknown>;
    expect(session.updateAge).toBe(900);
  });

  it('configures session.cookieCache.enabled to true', async () => {
    await import('@/lib/auth');
    const session = (betterAuthOptions as Record<string, unknown>).session as Record<string, unknown>;
    const cookieCache = session.cookieCache as Record<string, unknown>;
    expect(cookieCache).toBeDefined();
    expect(cookieCache.enabled).toBe(true);
  });

  it('configures session.cookieCache.maxAge to 300 (5 minutes)', async () => {
    await import('@/lib/auth');
    const session = (betterAuthOptions as Record<string, unknown>).session as Record<string, unknown>;
    const cookieCache = session.cookieCache as Record<string, unknown>;
    expect(cookieCache.maxAge).toBe(300);
  });

  it('configures requireEmailVerification to true', async () => {
    await import('@/lib/auth');
    const emailAndPassword = (betterAuthOptions as Record<string, unknown>).emailAndPassword as Record<string, unknown>;
    expect(emailAndPassword.requireEmailVerification).toBe(true);
  });
});
