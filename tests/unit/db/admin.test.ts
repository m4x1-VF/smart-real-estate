import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
  };
});

vi.mock('@/lib/db/client', () => ({
  getDb: () => mocks.sql,
}));

describe('isAdmin (T9 → R1, R2)', () => {
  beforeEach(() => {
    mocks.sql.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when the user has admin role', async () => {
    mocks.sql.mockResolvedValue([{ one: 1 }]);

    const { isAdmin } = await import('@/lib/db/admin');
    const result = await isAdmin('user-admin-1');

    expect(result).toBe(true);
    expect(mocks.sql).toHaveBeenCalled();
  });

  it('returns false when the user does not have admin role', async () => {
    mocks.sql.mockResolvedValue([]);

    const { isAdmin } = await import('@/lib/db/admin');
    const result = await isAdmin('user-regular-1');

    expect(result).toBe(false);
  });

  it('returns false for a non-existent userId', async () => {
    mocks.sql.mockResolvedValue([]);

    const { isAdmin } = await import('@/lib/db/admin');
    const result = await isAdmin('non-existent-id');

    expect(result).toBe(false);
  });

  it('uses efficient query with SELECT 1 and LIMIT 1 (R1)', async () => {
    mocks.sql.mockResolvedValue([{ one: 1 }]);

    const { isAdmin } = await import('@/lib/db/admin');
    await isAdmin('user-admin-1');

    // The sql mock is called as a tagged template literal: sql`SELECT 1...`
    // First argument is the template strings array
    expect(mocks.sql).toHaveBeenCalled();
    const callArgs = mocks.sql.mock.calls[0];
    // Tagged template: first arg is TemplateStringsArray
    const templateStrings = callArgs[0] as TemplateStringsArray;
    const fullQuery = templateStrings.join('');

    expect(fullQuery).toContain('SELECT 1');
    expect(fullQuery).toContain('LIMIT 1');
    expect(fullQuery).toContain('user_roles');
    expect(fullQuery).toContain('admin');
  });
});

describe('isAdminUser removal (R9)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not export isAdminUser (old email-based helper removed)', async () => {
    const adminModule = await import('@/lib/db/admin');

    // isAdminUser should not exist — it was replaced by isAdmin(userId)
    expect((adminModule as Record<string, unknown>).isAdminUser).toBeUndefined();
  });

  it('exports isAdmin as the only authorization function', async () => {
    const adminModule = await import('@/lib/db/admin');

    expect(typeof adminModule.isAdmin).toBe('function');
    // Ensure no legacy exports remain
    const exportedKeys = Object.keys(adminModule);
    expect(exportedKeys).toEqual(['isAdmin']);
  });
});
