// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  sql: vi.fn(),
  isAdmin: vi.fn(),
  cookieGet: vi.fn().mockReturnValue(undefined),
  getDictionary: vi.fn(),
}));

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
  cookies: vi.fn().mockImplementation(async () => ({
    get: mocks.cookieGet,
  })),
}));

// Mock next/navigation
const redirectMock = vi.fn((url: string) => {
  const err = new Error(`NEXT_REDIRECT: ${url}`);
  (err as unknown as Record<string, string>).digest = 'NEXT_REDIRECT';
  throw err;
});
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className} data-testid={`link-${href}`}>
        {children}
      </a>
    );
  },
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid="next-image" />;
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
    },
  },
}));

// Mock DB
vi.mock('@/lib/db/client', () => ({
  getDb: () => mocks.sql,
}));

// Mock admin helper
vi.mock('@/lib/db/admin', () => ({
  isAdmin: (...args: unknown[]) => mocks.isAdmin(...args),
}));

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  getDictionary: (...args: unknown[]) => mocks.getDictionary(...args),
}));

// Mock AdminNav (client component) — observe the prop it receives.
const { adminNavPropsSpy } = vi.hoisted(() => ({
  adminNavPropsSpy: vi.fn(),
}));

vi.mock('@/components/admin/AdminNav', () => ({
  default: function MockAdminNav(props: {
    user: { email: string };
    t: Record<string, string>;
  }) {
    adminNavPropsSpy(props);
    return <nav data-testid="admin-nav">AdminNav({props.user.email})</nav>;
  },
}));

const DICT = {
  nav: {
    dashboard: 'NAV_DASH',
    properties: 'NAV_PROPS',
    users: 'NAV_USERS',
    administrator: 'NAV_ADMIN',
  },
  layout: {
    forbidden_title: 'LAYOUT_403',
    forbidden_message: 'LAYOUT_FORBIDDEN_MSG',
  },
};

async function renderAdminLayout() {
  const { default: AdminLayout } = await import('@/app/admin/layout');
  const result = await AdminLayout({
    children: <div data-testid="layout-children">children</div> as ReactNode,
  });
  render(result as React.ReactElement);
}

describe('AdminLayout (T17 → R6, R17)', () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.sql.mockReset();
    mocks.isAdmin.mockReset();
    mocks.cookieGet.mockReset();
    mocks.cookieGet.mockReturnValue(undefined);
    mocks.getDictionary.mockReset();
    mocks.getDictionary.mockReturnValue({ dashboard: DICT });
    adminNavPropsSpy.mockReset();
    redirectMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('redirects to /login when there is no session', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(renderAdminLayout()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('renders the 403 forbidden state from the dict for non-admin users', async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'joe@example.com' },
    });
    // isAdmin returns false for this user
    mocks.isAdmin.mockResolvedValue(false);

    await renderAdminLayout();

    expect(screen.getByText('LAYOUT_403')).toBeInTheDocument();
    expect(screen.getByText('LAYOUT_FORBIDDEN_MSG')).toBeInTheDocument();
    // AdminNav should NOT have been rendered
    expect(screen.queryByTestId('admin-nav')).not.toBeInTheDocument();
  });

  it('renders AdminNav with the dict nav section for admin users', async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'admin@example.com' },
    });
    // isAdmin returns true for this user
    mocks.isAdmin.mockResolvedValue(true);

    await renderAdminLayout();

    expect(screen.getByTestId('admin-nav')).toBeInTheDocument();
    expect(adminNavPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ t: DICT.nav }),
    );
  });

  it('renders the footer with the hardcoded Spanish text (R17 — no dict)', async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'admin@example.com' },
    });
    mocks.isAdmin.mockResolvedValue(true);

    await renderAdminLayout();

    // The footer text contains "Todos los derechos reservados" — literal Spanish.
    expect(
      screen.getByText(/Todos los derechos reservados/i),
    ).toBeInTheDocument();
  });

  it('forbidden state uses the layout dict keys, not the common duplicate', async () => {
    // Mock distinct values for layout.forbidden_* vs common.forbidden_*.
    mocks.getDictionary.mockReturnValue({
      dashboard: {
        ...DICT,
        common: {
          forbidden_title: 'COMMON_403',
          forbidden_message: 'COMMON_FORBIDDEN_MSG',
        },
      },
    });
    mocks.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'joe@example.com' },
    });
    mocks.isAdmin.mockResolvedValue(false);

    await renderAdminLayout();

    // The layout uses the LAYOUT_403 / LAYOUT_FORBIDDEN_MSG, not COMMON_*.
    expect(screen.getByText('LAYOUT_403')).toBeInTheDocument();
    expect(screen.queryByText('COMMON_403')).not.toBeInTheDocument();
  });
});
