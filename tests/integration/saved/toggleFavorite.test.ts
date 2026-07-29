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
const getSessionMock = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
}));

// Mock DB functions
const addFavoriteMock = vi.fn();
const removeFavoriteMock = vi.fn();
const isFavoriteMock = vi.fn();
vi.mock('@/lib/db/favorites', () => ({
  addFavorite: (...args: unknown[]) => addFavoriteMock(...args),
  removeFavorite: (...args: unknown[]) => removeFavoriteMock(...args),
  isFavorite: (...args: unknown[]) => isFavoriteMock(...args),
  getFavoritePropertyIds: vi.fn(),
  listFavoriteProperties: vi.fn(),
}));

// Mock postgres-js (needed for lib/db/client import chain)
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

describe('toggleFavorite server action', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    addFavoriteMock.mockReset();
    removeFavoriteMock.mockReset();
    isFavoriteMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  async function getActions() {
    return import('@/app/saved/actions');
  }

  it('adds favorite when property is not yet favorited', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', name: 'Test' },
      session: { id: 'session-1' },
    });
    isFavoriteMock.mockResolvedValue(false);
    addFavoriteMock.mockResolvedValue(undefined);

    const { toggleFavorite } = await getActions();
    const result = await toggleFavorite(VALID_UUID);

    expect(result.isFavorited).toBe(true);
    expect(addFavoriteMock).toHaveBeenCalledWith('user-1', VALID_UUID);
    expect(removeFavoriteMock).not.toHaveBeenCalled();
  });

  it('removes favorite when property is already favorited', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', name: 'Test' },
      session: { id: 'session-1' },
    });
    isFavoriteMock.mockResolvedValue(true);
    removeFavoriteMock.mockResolvedValue(undefined);

    const { toggleFavorite } = await getActions();
    const result = await toggleFavorite(VALID_UUID);

    expect(result.isFavorited).toBe(false);
    expect(removeFavoriteMock).toHaveBeenCalledWith('user-1', VALID_UUID);
    expect(addFavoriteMock).not.toHaveBeenCalled();
  });

  it('throws "Not authenticated" when no session exists', async () => {
    getSessionMock.mockResolvedValue(null);

    const { toggleFavorite } = await getActions();
    await expect(toggleFavorite(VALID_UUID)).rejects.toThrow('Not authenticated');
    expect(addFavoriteMock).not.toHaveBeenCalled();
    expect(removeFavoriteMock).not.toHaveBeenCalled();
    expect(isFavoriteMock).not.toHaveBeenCalled();
  });

  it('throws "Invalid property id" for non-uuid input', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', name: 'Test' },
      session: { id: 'session-1' },
    });

    const { toggleFavorite } = await getActions();
    await expect(toggleFavorite('not-a-uuid')).rejects.toThrow('Invalid property id');
    expect(isFavoriteMock).not.toHaveBeenCalled();
  });
});
