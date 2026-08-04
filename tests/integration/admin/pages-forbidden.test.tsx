// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  isAdmin: vi.fn(),
  sql: vi.fn(),
  listProperties: vi.fn(),
  countProperties: vi.fn(),
  getPropertyBySlug: vi.fn(),
  cookieGet: vi.fn().mockReturnValue(undefined),
  getDictionary: vi.fn(),
  headersSet: vi.fn(),
  forbidden: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockImplementation(async () => {
    const h = new Headers();
    h.set = mocks.headersSet;
    return h;
  }),
  cookies: vi.fn().mockImplementation(async () => ({
    get: mocks.cookieGet,
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
  forbidden: (...args: unknown[]) => mocks.forbidden(...args),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

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

vi.mock('next/image', () => ({
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid="next-image" />;
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mocks.getSession(...args),
    },
  },
}));

vi.mock('@/lib/db/admin', () => ({
  isAdmin: (...args: unknown[]) => mocks.isAdmin(...args),
}));

vi.mock('@/lib/db/client', () => ({
  getDb: () => mocks.sql,
}));

vi.mock('@/lib/db/properties', () => ({
  listProperties: (...args: unknown[]) => mocks.listProperties(...args),
  countProperties: (...args: unknown[]) => mocks.countProperties(...args),
  getPropertyBySlug: (...args: unknown[]) => mocks.getPropertyBySlug(...args),
}));

vi.mock('@/lib/i18n', () => ({
  getDictionary: (...args: unknown[]) => mocks.getDictionary(...args),
}));

vi.mock('@/app/admin/users/actions', () => ({
  toggleUserRole: vi.fn(),
}));

vi.mock('@/app/admin/properties/actions', () => ({
  togglePropertyActiveAction: vi.fn(),
}));

vi.mock('@/components/admin/PropertyForm', () => ({
  default: function MockPropertyForm() {
    return <div data-testid="property-form">PropertyForm</div>;
  },
}));

const DICT = {
  layout: {
    forbidden_title: 'FORBIDDEN_TITLE',
    forbidden_message: 'FORBIDDEN_MSG',
  },
  users_list: {
    title: 'UL_TITLE',
    subtitle: 'UL_SUBTITLE',
    search_placeholder: 'UL_SEARCH',
    add_user: 'UL_ADD',
    tabs: { all: 'A', agents: 'B', brokers: 'C', admins: 'D' },
    table: { user_details: 'E', role_status: 'F', performance: 'G', actions: 'H' },
    badges: { administrator: 'I', user: 'J', active: 'K' },
    performance: { properties: 'L', access_level: 'M' },
    actions: { make_admin: 'N', remove_admin: 'O' },
    empty: 'P',
    pagination: { showing: '{from}-{to}/{total}' },
    unknown_user: 'Q',
  },
  properties_list: {
    title: 'PL_TITLE',
    subtitle: 'PL_SUBTITLE',
    add_new_property: 'PL_ADD',
    stats: { total_listings: 'PL_T', active_listings: 'PL_A', inactive_listings: 'PL_I' },
    table: { property_details: 'PL_D', price: 'PL_P', status: 'PL_S', actions: 'PL_AC' },
    badges: { active: 'PL_BA', inactive: 'PL_BI', featured: 'PL_BF' },
    titles: { edit_property: 'PL_TE', activate_property: 'PL_TA', deactivate_property: 'PL_TD' },
    empty: 'PL_E',
    pagination: { showing: '{from}-{to}/{total}' },
    beds: 'Hab',
    baths: 'Baños',
    type_sale: 'PL_TS',
    type_rent: 'PL_TR',
  },
  property_form: {
    breadcrumb_aria: 'bc',
    breadcrumb: { properties: 'Props', add_new: 'Add', edit: 'Edit {title}' },
  },
  common: {
    page_title_create: 'CREATE',
    page_subtitle_create: 'CREATE_SUB',
    page_title_edit: 'EDIT',
    page_subtitle_edit: 'EDIT_SUB',
  },
};

// forbidden() throws in Next.js — simulate that behavior
const FORBIDDEN_ERROR = new Error('NEXT_NOT_FOUND');

describe('Admin pages 403 for non-admin (T12 → R4, R5)', () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.isAdmin.mockReset();
    mocks.sql.mockReset();
    mocks.listProperties.mockReset();
    mocks.countProperties.mockReset();
    mocks.getPropertyBySlug.mockReset();
    mocks.cookieGet.mockReset();
    mocks.cookieGet.mockReturnValue(undefined);
    mocks.getDictionary.mockReset();
    mocks.getDictionary.mockReturnValue({ dashboard: DICT });
    mocks.headersSet.mockReset();
    mocks.forbidden.mockReset();
    // forbidden() throws to terminate rendering — simulate Next.js behavior
    mocks.forbidden.mockImplementation(() => {
      throw FORBIDDEN_ERROR;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminUsersPage', () => {
    it('calls forbidden() for non-admin users (HTTP 403)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { default: AdminUsersPage } = await import('@/app/admin/users/page');
      await expect(
        AdminUsersPage({ searchParams: Promise.resolve({}) }),
      ).rejects.toThrow(FORBIDDEN_ERROR);

      expect(mocks.forbidden).toHaveBeenCalled();
    });

    it('sets Cache-Control header BEFORE admin check (always present)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'admin@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(true);
      mocks.sql.mockResolvedValue([]);

      const { default: AdminUsersPage } = await import('@/app/admin/users/page');
      await AdminUsersPage({ searchParams: Promise.resolve({}) });

      expect(mocks.headersSet).toHaveBeenCalledWith('Cache-Control', 'no-store, private');
    });

    it('sets Cache-Control header even for non-admin (before forbidden)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { default: AdminUsersPage } = await import('@/app/admin/users/page');
      await expect(
        AdminUsersPage({ searchParams: Promise.resolve({}) }),
      ).rejects.toThrow();

      expect(mocks.headersSet).toHaveBeenCalledWith('Cache-Control', 'no-store, private');
    });
  });

  describe('AdminPropertiesPage', () => {
    it('calls forbidden() for non-admin users (HTTP 403)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { default: AdminPropertiesPage } = await import('@/app/admin/properties/page');
      await expect(
        AdminPropertiesPage({ searchParams: Promise.resolve({}) }),
      ).rejects.toThrow(FORBIDDEN_ERROR);

      expect(mocks.forbidden).toHaveBeenCalled();
    });

    it('sets Cache-Control header BEFORE admin check (always present)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'admin@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(true);
      mocks.listProperties.mockResolvedValue({ properties: [] });
      mocks.countProperties.mockResolvedValue(0);

      const { default: AdminPropertiesPage } = await import('@/app/admin/properties/page');
      await AdminPropertiesPage({ searchParams: Promise.resolve({}) });

      expect(mocks.headersSet).toHaveBeenCalledWith('Cache-Control', 'no-store, private');
    });

    it('sets Cache-Control header even for non-admin (before forbidden)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { default: AdminPropertiesPage } = await import('@/app/admin/properties/page');
      await expect(
        AdminPropertiesPage({ searchParams: Promise.resolve({}) }),
      ).rejects.toThrow();

      expect(mocks.headersSet).toHaveBeenCalledWith('Cache-Control', 'no-store, private');
    });
  });

  describe('CreatePropertyPage', () => {
    it('calls forbidden() for non-admin users (HTTP 403)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { default: CreatePropertyPage } = await import('@/app/admin/properties/create/page');
      await expect(CreatePropertyPage()).rejects.toThrow(FORBIDDEN_ERROR);

      expect(mocks.forbidden).toHaveBeenCalled();
    });

    it('sets Cache-Control header BEFORE admin check (always present)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { default: CreatePropertyPage } = await import('@/app/admin/properties/create/page');
      await expect(CreatePropertyPage()).rejects.toThrow();

      expect(mocks.headersSet).toHaveBeenCalledWith('Cache-Control', 'no-store, private');
    });
  });

  describe('EditPropertyPage', () => {
    it('calls forbidden() for non-admin users (HTTP 403)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { default: EditPropertyPage } = await import('@/app/admin/properties/[id]/edit/page');
      await expect(
        EditPropertyPage({ params: Promise.resolve({ id: 'test-slug' }) }),
      ).rejects.toThrow(FORBIDDEN_ERROR);

      expect(mocks.forbidden).toHaveBeenCalled();
    });

    it('sets Cache-Control header BEFORE admin check (always present)', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'u1', email: 'user@example.com' },
      });
      mocks.isAdmin.mockResolvedValue(false);

      const { default: EditPropertyPage } = await import('@/app/admin/properties/[id]/edit/page');
      await expect(
        EditPropertyPage({ params: Promise.resolve({ id: 'test-slug' }) }),
      ).rejects.toThrow();

      expect(mocks.headersSet).toHaveBeenCalledWith('Cache-Control', 'no-store, private');
    });
  });
});
