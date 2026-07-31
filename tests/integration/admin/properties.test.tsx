// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const mocks = vi.hoisted(() => {
  return {
    listProperties: vi.fn(),
    countProperties: vi.fn(),
    toggleAction: vi.fn(),
    cookieGet: vi.fn().mockReturnValue(undefined),
    getDictionary: vi.fn(),
  };
});

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

// Mock DB
vi.mock('@/lib/db/properties', () => ({
  listProperties: (...args: unknown[]) => mocks.listProperties(...args),
  countProperties: (...args: unknown[]) => mocks.countProperties(...args),
}));

// Mock actions
vi.mock('@/app/admin/properties/actions', () => ({
  togglePropertyActiveAction: mocks.toggleAction,
}));

const DICT = {
  properties_list: {
    title: 'PL_TITLE',
    subtitle: 'PL_SUBTITLE',
    add_new_property: 'PL_ADD_NEW',
    stats: {
      total_listings: 'PL_TOTAL',
      active_listings: 'PL_ACTIVE',
      inactive_listings: 'PL_INACTIVE',
    },
    table: {
      property_details: 'PL_TBL_DET',
      price: 'PL_TBL_PRICE',
      status: 'PL_TBL_STATUS',
      actions: 'PL_TBL_ACTIONS',
    },
    badges: {
      active: 'PL_B_ACTIVE',
      inactive: 'PL_B_INACTIVE',
      featured: 'PL_B_FEATURED',
    },
    titles: {
      edit_property: 'PL_T_EDIT',
      activate_property: 'PL_T_ACTIVATE',
      deactivate_property: 'PL_T_DEACTIVATE',
    },
    empty: 'PL_EMPTY',
    pagination: { showing: '{from}-{to}/{total}' },
    beds: 'Hab',
    baths: 'Baños',
    type_sale: 'PL_TYPE_SALE',
    type_rent: 'PL_TYPE_RENT',
  },
};

const mockProperty = {
  id: 'p1',
  title: 'Casa Bonita',
  slug: 'casa-bonita',
  description: null,
  price: 100000,
  type: 'sale' as const,
  location: 'Madrid',
  lat: 40.4168,
  lng: -3.7038,
  beds: 3,
  baths: 2,
  parking: 1,
  sqft: 120,
  year_built: 2020,
  images: [],
  amenities: [],
  is_active: true,
  is_featured: false,
  is_new: false,
  created_at: '2024-01-01T00:00:00.000Z',
};

async function renderAdminPropertiesPage() {
  const { default: AdminPropertiesPage } = await import(
    '@/app/admin/properties/page'
  );
  const result = await AdminPropertiesPage({
    searchParams: Promise.resolve({}),
  });
  render(result as React.ReactElement);
}

describe('AdminPropertiesPage (T15 → R14, R6, R3)', () => {
  beforeEach(() => {
    mocks.listProperties.mockReset();
    mocks.countProperties.mockReset();
    mocks.cookieGet.mockReset();
    mocks.cookieGet.mockReturnValue(undefined);
    mocks.getDictionary.mockReset();
    mocks.getDictionary.mockReturnValue({ dashboard: DICT });
    mocks.listProperties.mockResolvedValue({ properties: [mockProperty] });
    mocks.countProperties.mockResolvedValue(1);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders title, subtitle, add_new_property, stats, and badges from the dict', async () => {
    await renderAdminPropertiesPage();

    expect(screen.getByText('PL_TITLE')).toBeInTheDocument();
    expect(screen.getByText('PL_SUBTITLE')).toBeInTheDocument();
    expect(screen.getByText('PL_ADD_NEW')).toBeInTheDocument();
    expect(screen.getByText('PL_TOTAL')).toBeInTheDocument();
    expect(screen.getByText('PL_ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('PL_INACTIVE')).toBeInTheDocument();
    expect(screen.getByText('PL_TBL_DET')).toBeInTheDocument();
    expect(screen.getByText('PL_B_ACTIVE')).toBeInTheDocument();
  });

  it('renders the "inactive" badge when property.is_active is false', async () => {
    mocks.listProperties.mockResolvedValue({
      properties: [{ ...mockProperty, is_active: false }],
    });
    await renderAdminPropertiesPage();

    expect(screen.getByText('PL_B_INACTIVE')).toBeInTheDocument();
  });

  it('renders the "featured" badge when property.is_featured is true', async () => {
    mocks.listProperties.mockResolvedValue({
      properties: [{ ...mockProperty, is_featured: true }],
    });
    await renderAdminPropertiesPage();

    expect(screen.getByText('PL_B_FEATURED')).toBeInTheDocument();
  });

  it('renders the empty state string when there are no properties', async () => {
    mocks.listProperties.mockResolvedValue({ properties: [] });
    mocks.countProperties.mockResolvedValue(0);
    await renderAdminPropertiesPage();

    expect(screen.getByText('PL_EMPTY')).toBeInTheDocument();
  });

  it('renders the translated "sale" label under the price when property.type is "sale"', async () => {
    mocks.listProperties.mockResolvedValue({
      properties: [{ ...mockProperty, type: 'sale' }],
    });
    await renderAdminPropertiesPage();

    expect(screen.getByText('PL_TYPE_SALE')).toBeInTheDocument();
    expect(screen.queryByText('PL_TYPE_RENT')).not.toBeInTheDocument();
    expect(screen.queryByText('sale')).not.toBeInTheDocument();
  });

  it('renders the translated "rent" label under the price when property.type is "rent"', async () => {
    mocks.listProperties.mockResolvedValue({
      properties: [{ ...mockProperty, type: 'rent' }],
    });
    await renderAdminPropertiesPage();

    expect(screen.getByText('PL_TYPE_RENT')).toBeInTheDocument();
    expect(screen.queryByText('PL_TYPE_SALE')).not.toBeInTheDocument();
    expect(screen.queryByText('rent')).not.toBeInTheDocument();
  });
});
