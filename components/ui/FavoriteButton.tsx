'use client';

import { useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toggleFavorite } from '@/app/saved/actions';

/**
 * FavoriteButton — Client Component with optimistic state.
 *
 * Design decision: uses plain `useState` instead of React 19's `useOptimistic`.
 * Rationale: the toggle is a simple boolean flip; `useOptimistic` would require
 * `useTransition` overhead with no real benefit. `useState` keeps the
 * revert-on-error logic explicit and easy to test without mocking startTransition.
 * See design.md §4 for the full alternative analysis.
 */
interface FavoriteButtonProps {
  propertyId: string;
  isFavorited: boolean;
  position?: 'top-3 right-3' | 'top-4 right-4';
  size?: 'lg' | 'xl';
}

export default function FavoriteButton({
  propertyId,
  isFavorited,
  position = 'top-3 right-3',
  size = 'lg',
}: FavoriteButtonProps) {
  const [optimistic, setOptimistic] = useState(isFavorited);
  const router = useRouter();

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !optimistic;
    setOptimistic(next);

    try {
      const result = await toggleFavorite(propertyId);
      setOptimistic(result.isFavorited);
    } catch {
      setOptimistic(!next);
      router.push('/login');
    }
  };

  const icon = optimistic ? 'favorite' : 'favorite_border';
  const iconSize = size === 'xl' ? 'text-xl' : 'text-lg';

  const positionClasses =
    position === 'top-4 right-4'
      ? 'w-10 h-10 top-4 right-4'
      : 'p-2 top-3 right-3';

  return (
    <button
      onClick={handleClick}
      className={`absolute ${positionClasses} rounded-full bg-white/90 backdrop-blur-sm hover:bg-mosque hover:text-white transition-all text-nordic z-10 flex items-center justify-center`}
      aria-label="Toggle favorite"
    >
      <span className={`material-icons ${iconSize} font-material-icons`}>
        {icon}
      </span>
    </button>
  );
}
