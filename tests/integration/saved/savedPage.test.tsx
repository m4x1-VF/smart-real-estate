// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const { getSessionMock, listFavoritePropertiesMock, redirectMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  listFavoritePropertiesMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT: ${url}`);
    (err as unknown as Record<string, string>).digest = 'NEXT_REDIRECT';
    throw err;
  }),
}));

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
}));

// Mock server actions
vi.mock('@/app/saved/actions', () => ({
  listFavoriteProperties: (...args: unknown[]) => listFavoritePropertiesMock(...args),
  getFavoritePropertyIds: vi.fn().mockResolvedValue([]),
  toggleFavorite: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid="next-image" />;
  },
}));

// Mock Navbar
vi.mock('@/components/Navbar', () => ({
  default: function MockNavbar() {
    return <nav data-testid="navbar">Navbar</nav>;
  },
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

import SavedPage from '@/app/saved/page';

describe('SavedPage', () => {
  beforeEach(() => {
    vi.resetModules();
    getSessionMock.mockReset();
    listFavoritePropertiesMock.mockReset();
    redirectMock.mockClear();
    // Re-set the throw implementation after clear
    redirectMock.mockImplementation((url: string) => {
      const err = new Error(`NEXT_REDIRECT: ${url}`);
      (err as unknown as Record<string, string>).digest = 'NEXT_REDIRECT';
      throw err;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockProperty = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'Saved Property',
    slug: 'saved-property',
    description: null,
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
    amenities: [],
    is_active: true,
    is_featured: false,
    is_new: false,
    created_at: '2024-01-01T00:00:00.000Z',
  };

  it('redirects to /login when no session', async () => {
    getSessionMock.mockResolvedValue(null);

    await expect(SavedPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('renders PropertyCards when session exists and has favorites', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', name: 'Test' },
      session: { id: 'session-1' },
    });
    listFavoritePropertiesMock.mockResolvedValue([mockProperty]);

    const result = await SavedPage();
    render(result as React.ReactElement);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(screen.getByText('Saved Homes')).toBeInTheDocument();
    expect(screen.getByText('Saved Property')).toBeInTheDocument();
  });

  it('renders empty state when user has no favorites', async () => {
    getSessionMock.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', name: 'Test' },
      session: { id: 'session-1' },
    });
    listFavoritePropertiesMock.mockResolvedValue([]);

    const result = await SavedPage();
    render(result as React.ReactElement);

    expect(screen.getByText('No saved properties yet.')).toBeInTheDocument();
  });
});
