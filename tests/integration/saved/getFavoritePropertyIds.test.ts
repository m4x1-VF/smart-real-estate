import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Mock DB functions
const getFavoritePropertyIdsMock = vi.fn();
vi.mock('@/lib/db/favorites', () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  isFavorite: vi.fn(),
  getFavoritePropertyIds: (...args: unknown[]) => getFavoritePropertyIdsMock(...args),
  listFavoriteProperties: vi.fn(),
}));

// Mock postgres-js
vi.mock('postgres', () => ({
  default: vi.fn(),
}));

vi.mock('kysely-postgres-js', () => {
  const noop = vi.fn();
  return {
    PostgresJSDialect: class {
      createDriver() { return {}; }
      createQueryCompiler() { return { compileQuery: noop }; }
      createAdapter() { return {}; }
      createIntrospector() { return { getSchemas: vi.fn().mockResolvedValue([]) }; }
    },
  };
});

describe('getFavoritePropertyIds server action', () => {
  beforeEach(() => {
    vi.resetModules();
    getFavoritePropertyIdsMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function getActions() {
    return import('@/app/saved/actions');
  }

  it('returns correct property IDs for a user', async () => {
    const ids = [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    ];
    getFavoritePropertyIdsMock.mockResolvedValue(ids);

    const { getFavoritePropertyIds } = await getActions();
    const result = await getFavoritePropertyIds('user-1');

    expect(result).toEqual(ids);
    expect(getFavoritePropertyIdsMock).toHaveBeenCalledWith('user-1');
  });

  it('returns empty array when user has no favorites', async () => {
    getFavoritePropertyIdsMock.mockResolvedValue([]);

    const { getFavoritePropertyIds } = await getActions();
    const result = await getFavoritePropertyIds('user-2');

    expect(result).toEqual([]);
    expect(getFavoritePropertyIdsMock).toHaveBeenCalledWith('user-2');
  });
});
