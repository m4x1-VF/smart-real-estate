// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

const { signOutMock, pushMock, refreshMock } = vi.hoisted(() => ({
  signOutMock: vi.fn().mockResolvedValue(undefined),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid="next-image" />;
  },
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

// Mock auth client
vi.mock('@/lib/auth/client', () => ({
  authClient: { signOut: signOutMock },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  usePathname: () => '/admin',
}));

// Mock avatar util
vi.mock('@/lib/utils/avatar', () => ({
  generateInitialsAvatar: vi
    .fn()
    .mockReturnValue('data:image/svg+xml;base64,mock'),
}));

import AdminNav from '@/components/admin/AdminNav';
import type { DashboardNavDict } from '@/types/i18n';

const MOCK_NAV_T: DashboardNavDict = {
  dashboard: 'NAV_DASH',
  properties: 'NAV_PROPS',
  users: 'NAV_USERS',
  administrator: 'NAV_ADMIN',
};

const MOCK_USER = {
  id: 'u1',
  name: 'Admin User',
  email: 'admin@example.com',
  image: null,
};

describe('AdminNav (T13 → R7, R13, R17)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nav.dashboard, nav.properties, nav.users from the dict prop', () => {
    render(<AdminNav user={MOCK_USER} t={MOCK_NAV_T} />);

    expect(screen.getByText('NAV_DASH')).toBeInTheDocument();
    expect(screen.getByText('NAV_PROPS')).toBeInTheDocument();
    expect(screen.getByText('NAV_USERS')).toBeInTheDocument();
  });

  it('renders nav.administrator under the avatar from the dict prop', () => {
    render(<AdminNav user={MOCK_USER} t={MOCK_NAV_T} />);

    expect(screen.getByText('NAV_ADMIN')).toBeInTheDocument();
  });

  it('renders the literal "Cerrar sesión" in the dropdown (R17 keeps it)', async () => {
    render(<AdminNav user={MOCK_USER} t={MOCK_NAV_T} />);

    // Open dropdown
    const avatarButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(avatarButton);

    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('does not read NEXT_LOCALE cookie itself (no document.cookie access)', () => {
    const cookieSpy = vi.spyOn(document, 'cookie', 'get');
    render(<AdminNav user={MOCK_USER} t={MOCK_NAV_T} />);
    expect(cookieSpy).not.toHaveBeenCalled();
  });
});
