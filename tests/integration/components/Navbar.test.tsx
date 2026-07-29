// @vitest-environment happy-dom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
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

// Mock LanguageSelector
vi.mock('@/components/LanguageSelector', () => ({
  default: function MockLanguageSelector() {
    return <div data-testid="language-selector">Language</div>;
  },
}));

// Mock LogoutButton
vi.mock('@/components/LogoutButton', () => ({
  default: function MockLogoutButton() {
    return <button data-testid="logout-button">Logout</button>;
  },
}));

// Mock avatar util
vi.mock('@/lib/utils/avatar', () => ({
  generateInitialsAvatar: vi.fn().mockReturnValue('data:image/svg+xml;base64,mock'),
}));

import Navbar from '@/components/Navbar';

describe('Navbar component', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders saved_homes link with href="/saved" in desktop and mobile nav', async () => {
    const navbar = await Navbar();
    render(navbar as React.ReactElement);

    // Both desktop and mobile links point to /saved
    const savedLinks = screen.getAllByTestId('link-/saved');
    expect(savedLinks.length).toBe(2); // desktop + mobile
    savedLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/saved');
    });
  });
});
