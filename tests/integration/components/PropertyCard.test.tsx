// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

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
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
}));

// Mock FavoriteButton to inspect props
const { favoriteButtonPropsSpy } = vi.hoisted(() => ({
  favoriteButtonPropsSpy: vi.fn(),
}));

vi.mock('@/components/ui/FavoriteButton', () => ({
  default: function MockFavoriteButton(props: {
    propertyId: string;
    isFavorited: boolean;
    position?: string;
    size?: string;
  }) {
    favoriteButtonPropsSpy(props);
    return (
      <button data-testid="favorite-button">
        {props.isFavorited ? 'favorite' : 'favorite_border'}
      </button>
    );
  },
}));

import PropertyCard from '@/components/ui/PropertyCard';

const mockProperty = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  title: 'Test Property',
  slug: 'test-property',
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

describe('PropertyCard component', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders property title and price', () => {
    render(<PropertyCard property={mockProperty} />);

    expect(screen.getByText('Test Property')).toBeInTheDocument();
    // Price is in an h3; use role to target it specifically (avoids matching sqft "1500")
    const priceHeading = screen.getByRole('heading', { level: 3 });
    expect(priceHeading.textContent).toMatch(/\$/);
  });

  it('passes isFavorited=false to FavoriteButton by default', () => {
    render(<PropertyCard property={mockProperty} />);

    expect(favoriteButtonPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: mockProperty.id,
        isFavorited: false,
      }),
    );
  });

  it('passes isFavorited=true to FavoriteButton when prop is true', () => {
    render(<PropertyCard property={mockProperty} isFavorited={true} />);

    expect(favoriteButtonPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: mockProperty.id,
        isFavorited: true,
      }),
    );
  });

  it('passes correct position and size to FavoriteButton', () => {
    render(<PropertyCard property={mockProperty} />);

    expect(favoriteButtonPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        position: 'top-3 right-3',
        size: 'lg',
      }),
    );
  });
});
