// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { toggleFavoriteMock, pushMock } = vi.hoisted(() => ({
  toggleFavoriteMock: vi.fn(),
  pushMock: vi.fn(),
}));

// Mock server action
vi.mock('@/app/saved/actions', () => ({
  toggleFavorite: (...args: unknown[]) => toggleFavoriteMock(...args),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import FavoriteButton from '@/components/ui/FavoriteButton';

describe('FavoriteButton component', () => {
  const PROPERTY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders favorite (filled) icon when isFavorited is true', () => {
    render(<FavoriteButton propertyId={PROPERTY_ID} isFavorited={true} />);

    const icon = screen.getByText('favorite');
    expect(icon).toBeInTheDocument();
  });

  it('renders favorite_border (outline) icon when isFavorited is false', () => {
    render(<FavoriteButton propertyId={PROPERTY_ID} isFavorited={false} />);

    const icon = screen.getByText('favorite_border');
    expect(icon).toBeInTheDocument();
  });

  it('toggles icon optimistically on click (before server responds)', async () => {
    const user = userEvent.setup();
    // Server action that resolves slowly
    let resolveAction: (value: { isFavorited: boolean }) => void;
    toggleFavoriteMock.mockImplementation(
      () =>
        new Promise<{ isFavorited: boolean }>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(<FavoriteButton propertyId={PROPERTY_ID} isFavorited={false} />);

    // Initially shows outline
    expect(screen.getByText('favorite_border')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /toggle favorite/i });
    await user.click(button);

    // Immediately shows filled (optimistic)
    expect(screen.getByText('favorite')).toBeInTheDocument();

    // Resolve the server action
    resolveAction!({ isFavorited: true });

    await waitFor(() => {
      expect(toggleFavoriteMock).toHaveBeenCalledWith(PROPERTY_ID);
    });
  });

  it('calls preventDefault and stopPropagation on click (does not bubble to Link)', async () => {
    const user = userEvent.setup();
    toggleFavoriteMock.mockResolvedValue({ isFavorited: true });

    const parentClickHandler = vi.fn();
    render(
      <div onClick={parentClickHandler}>
        <FavoriteButton propertyId={PROPERTY_ID} isFavorited={false} />
      </div>,
    );

    const button = screen.getByRole('button', { name: /toggle favorite/i });
    await user.click(button);

    // Parent should NOT receive the click (stopPropagation)
    expect(parentClickHandler).not.toHaveBeenCalled();
    expect(toggleFavoriteMock).toHaveBeenCalledWith(PROPERTY_ID);
  });

  it('reverts optimistic state and redirects to /login on auth error', async () => {
    const user = userEvent.setup();
    toggleFavoriteMock.mockRejectedValue(new Error('Not authenticated'));

    render(<FavoriteButton propertyId={PROPERTY_ID} isFavorited={false} />);

    // Initially outline
    expect(screen.getByText('favorite_border')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /toggle favorite/i });
    await user.click(button);

    // After error, should revert back to outline
    await waitFor(() => {
      expect(screen.getByText('favorite_border')).toBeInTheDocument();
    });

    // Should redirect to /login
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('syncs state with server response after toggle', async () => {
    const user = userEvent.setup();
    toggleFavoriteMock.mockResolvedValue({ isFavorited: false });

    render(<FavoriteButton propertyId={PROPERTY_ID} isFavorited={true} />);

    // Initially filled
    expect(screen.getByText('favorite')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /toggle favorite/i });
    await user.click(button);

    // After server confirms, state should be outline
    await waitFor(() => {
      expect(screen.getByText('favorite_border')).toBeInTheDocument();
    });
  });
});
