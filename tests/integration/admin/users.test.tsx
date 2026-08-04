// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
  toggleUserRole: vi.fn(),
  cookieGet: vi.fn().mockReturnValue(undefined),
  getDictionary: vi.fn(),
  getSession: vi.fn(),
  isAdmin: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
  cookies: vi.fn().mockImplementation(async () => ({
    get: mocks.cookieGet,
  })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
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

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  getDictionary: (...args: unknown[]) => mocks.getDictionary(...args),
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
    },
  },
}));

// Mock admin helper
vi.mock('@/lib/db/admin', () => ({
  isAdmin: (...args: unknown[]) => mocks.isAdmin(...args),
}));

// Mock DB client — getDb() returns a fake `sql` template literal.
vi.mock('@/lib/db/client', () => ({
  getDb: () => mocks.sql,
}));

// Mock actions
vi.mock('@/app/admin/users/actions', () => ({
  toggleUserRole: (...args: unknown[]) => mocks.toggleUserRole(...args),
}));

const DICT = {
  users_list: {
    title: 'UL_TITLE',
    subtitle: 'UL_SUBTITLE',
    search_placeholder: 'UL_SEARCH_PH',
    add_user: 'UL_ADD_USER',
    tabs: {
      all: 'UL_TAB_ALL',
      agents: 'UL_TAB_AGENTS',
      brokers: 'UL_TAB_BROKERS',
      admins: 'UL_TAB_ADMINS',
    },
    table: {
      user_details: 'UL_TBL_DET',
      role_status: 'UL_TBL_ROLE',
      performance: 'UL_TBL_PERF',
      actions: 'UL_TBL_ACTIONS',
    },
    badges: {
      administrator: 'UL_B_ADMIN',
      user: 'UL_B_USER',
      active: 'UL_B_ACTIVE',
    },
    performance: {
      properties: 'UL_P_PROPS',
      access_level: 'UL_P_ACCESS',
    },
    actions: {
      make_admin: 'UL_A_MAKE_ADMIN',
      remove_admin: 'UL_A_REMOVE_ADMIN',
    },
    empty: 'UL_EMPTY',
    pagination: { showing: '{from}-{to}/{total}' },
    unknown_user: 'UL_UNKNOWN',
  },
};

const mockUserAdmin = {
  id: 'u-admin-1',
  email: 'admin@example.com',
  role: 'admin',
};
const mockUserRegular = {
  id: 'u-regular-1',
  email: 'user@example.com',
  role: 'user',
};

async function renderAdminUsersPage() {
  const { default: AdminUsersPage } = await import('@/app/admin/users/page');
  const result = await AdminUsersPage({
    searchParams: Promise.resolve({}),
  });
  render(result as React.ReactElement);
}

describe('AdminUsersPage (T16 → R14, R6, R3)', () => {
  beforeEach(() => {
    mocks.sql.mockReset();
    mocks.toggleUserRole.mockReset();
    mocks.cookieGet.mockReset();
    mocks.cookieGet.mockReturnValue(undefined);
    mocks.getDictionary.mockReset();
    mocks.getDictionary.mockReturnValue({ dashboard: DICT });
    mocks.getSession.mockReset();
    mocks.getSession.mockResolvedValue({
      user: { id: 'u-admin', email: 'admin@example.com' },
    });
    mocks.isAdmin.mockReset();
    mocks.isAdmin.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders title, subtitle, search placeholder, add_user, and tabs from the dict', async () => {
    mocks.sql.mockResolvedValue([mockUserRegular]);
    await renderAdminUsersPage();

    expect(screen.getByText('UL_TITLE')).toBeInTheDocument();
    expect(screen.getByText('UL_SUBTITLE')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('UL_SEARCH_PH')).toBeInTheDocument();
    expect(screen.getByText('UL_ADD_USER')).toBeInTheDocument();
    expect(screen.getByText('UL_TAB_ALL')).toBeInTheDocument();
    expect(screen.getByText('UL_TAB_AGENTS')).toBeInTheDocument();
    expect(screen.getByText('UL_TAB_BROKERS')).toBeInTheDocument();
    expect(screen.getByText('UL_TAB_ADMINS')).toBeInTheDocument();
    expect(screen.getByText('UL_TBL_DET')).toBeInTheDocument();
    expect(screen.getByText('UL_TBL_ROLE')).toBeInTheDocument();
    expect(screen.getByText('UL_TBL_PERF')).toBeInTheDocument();
    expect(screen.getByText('UL_TBL_ACTIONS')).toBeInTheDocument();
    expect(screen.getByText('UL_P_PROPS')).toBeInTheDocument();
    expect(screen.getByText('UL_P_ACCESS')).toBeInTheDocument();
  });

  it('renders "Administrator" badge and "Remove Admin" action for admin users', async () => {
    mocks.sql.mockResolvedValue([mockUserAdmin]);
    await renderAdminUsersPage();

    expect(screen.getByText('UL_B_ADMIN')).toBeInTheDocument();
    expect(screen.getByText('UL_A_REMOVE_ADMIN')).toBeInTheDocument();
  });

  it('renders "User" badge and "Make Admin" action for non-admin users', async () => {
    mocks.sql.mockResolvedValue([mockUserRegular]);
    await renderAdminUsersPage();

    expect(screen.getByText('UL_B_USER')).toBeInTheDocument();
    expect(screen.getByText('UL_A_MAKE_ADMIN')).toBeInTheDocument();
  });

  it('renders the active badge (UL_B_ACTIVE) for every user', async () => {
    mocks.sql.mockResolvedValue([mockUserAdmin, mockUserRegular]);
    await renderAdminUsersPage();

    // Each user card shows the "Active" badge → 2 occurrences
    const activeBadges = screen.getAllByText('UL_B_ACTIVE');
    expect(activeBadges.length).toBe(2);
  });

  it('renders the empty state string when there are no users', async () => {
    mocks.sql.mockResolvedValue([]);
    await renderAdminUsersPage();

    expect(screen.getByText('UL_EMPTY')).toBeInTheDocument();
  });
});
