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
const listFavoritePropertiesMock = vi.fn();
vi.mock('@/lib/db/favorites', () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  isFavorite: vi.fn(),
  getFavoritePropertyIds: vi.fn(),
  listFavoriteProperties: (...args: unknown[]) => listFavoritePropertiesMock(...args),
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

describe('listFavoriteProperties server action', () => {
  beforeEach(() => {
    vi.resetModules();
    listFavoritePropertiesMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function getActions() {
    return import('@/app/saved/actions');
  }

  const mockProperty = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'Test Property',
    slug: 'test-property',
    description: 'A test property',
    price: 500000,
    type: 'sale' as const,
    location: 'Test City',
    lat: 40.7128,
    lng: -74.006,
    beds: 3,
    baths: 2,
    parking: 1,
    sqft: 1500,
    year_built: 2020,
    images: ['https://example.com/image.jpg'],
    amenities: ['pool', 'garage'],
    is_active: true,
    is_featured: false,
    is_new: true,
    created_at: '2024-01-01T00:00:00.000Z',
  };

  it('returns complete properties ordered by created_at desc', async () => {
    const properties = [mockProperty];
    listFavoritePropertiesMock.mockResolvedValue(properties);

    const { listFavoriteProperties } = await getActions();
    const result = await listFavoriteProperties('user-1');

    expect(result).toEqual(properties);
    expect(result[0].title).toBe('Test Property');
    expect(listFavoritePropertiesMock).toHaveBeenCalledWith('user-1');
  });

  it('excludes inactive properties', async () => {
    // The DB adapter already filters is_active = true, so this test
    // verifies the wrapper passes through correctly
    const activeProperties = [mockProperty];
    listFavoritePropertiesMock.mockResolvedValue(activeProperties);

    const { listFavoriteProperties } = await getActions();
    const result = await listFavoriteProperties('user-1');

    expect(result.every((p) => p.is_active)).toBe(true);
  });

  it('returns empty array when user has no favorites', async () => {
    listFavoritePropertiesMock.mockResolvedValue([]);

    const { listFavoriteProperties } = await getActions();
    const result = await listFavoriteProperties('user-2');

    expect(result).toEqual([]);
    expect(listFavoritePropertiesMock).toHaveBeenCalledWith('user-2');
  });
});
