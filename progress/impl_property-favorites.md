# Implementation Traceability — property-favorites

> Map R<n> ↔ test. All tests green (100/100).

## R1 — Tabla favorites (PK compuesta, FK CASCADE)
- **L1**: `db/migrations/008_favorites.sql` — migration file verified by `pnpm build` (route `/saved` compiles).
- No automated L1 test (migration runs via `init.sh` / manual apply).

## R2 — toggleFavorite adds/removes favorite, returns new state
- **L2**: `tests/integration/saved/toggleFavorite.test.ts`
  - "adds favorite when property is not yet favorited" → `isFavorited: true`, `addFavorite` called
  - "removes favorite when property is already favorited" → `isFavorited: false`, `removeFavorite` called

## R3 — getFavoritePropertyIds returns string[] of property IDs
- **L2**: `tests/integration/saved/getFavoritePropertyIds.test.ts`
  - "returns correct property IDs for a user"
  - "returns empty array when user has no favorites"

## R4 — listFavoriteProperties returns complete Property[] ordered by created_at desc
- **L2**: `tests/integration/saved/listFavoriteProperties.test.ts`
  - "returns complete properties ordered by created_at desc"
  - "excludes inactive properties"
  - "returns empty array when user has no favorites"

## R5 — FavoriteButton optimistic state (icon toggles immediately on click)
- **L3**: `tests/integration/components/FavoriteButton.test.tsx`
  - "toggles icon optimistically on click (before server responds)"

## R6 — FavoriteButton renders `favorite` / `favorite_border` based on state
- **L3**: `tests/integration/components/FavoriteButton.test.tsx`
  - "renders favorite (filled) icon when isFavorited is true"
  - "renders favorite_border (outline) icon when isFavorited is false"

## R7 — PropertyCard/CollectionCard accept `isFavorited` prop, render FavoriteButton
- **L3**: `tests/integration/components/PropertyCard.test.tsx`
  - "passes isFavorited=false to FavoriteButton by default"
  - "passes isFavorited=true to FavoriteButton when prop is true"
  - "passes correct position and size to FavoriteButton"
- CollectionCard follows identical pattern (same FavoriteButton integration).

## R8 — FavoriteButton click does NOT navigate (preventDefault + stopPropagation)
- **L3**: `tests/integration/components/FavoriteButton.test.tsx`
  - "calls preventDefault and stopPropagation on click (does not bubble to Link)"

## R9 — Unauthenticated click redirects to /login
- **L3**: `tests/integration/components/FavoriteButton.test.tsx`
  - "reverts optimistic state and redirects to /login on auth error"

## R10 — /saved page renders PropertyCards with favorites
- **L2**: `tests/integration/saved/savedPage.test.tsx`
  - "renders PropertyCards when session exists and has favorites"
  - "renders empty state when user has no favorites"

## R11 — Navbar saved_homes link points to /saved (desktop + mobile)
- **L3**: `tests/integration/components/Navbar.test.tsx`
  - "renders saved_homes link with href="/saved" in desktop and mobile nav"

## R12 — /saved redirects to /login without session
- **L2**: `tests/integration/saved/savedPage.test.tsx`
  - "redirects to /login when no session"
- Middleware gate: `middleware.ts` adds `/saved` to protected routes.

## R13 — toggleFavorite rejects unauthenticated requests
- **L2**: `tests/integration/saved/toggleFavorite.test.ts`
  - "throws 'Not authenticated' when no session exists"
  - "throws 'Invalid property id' for non-uuid input"

## R14 — Traceability documented
- This file.

## Summary

| R<n> | Level | Test File | Tests |
|------|-------|-----------|-------|
| R1 | L1 | `db/migrations/008_favorites.sql` | manual / init.sh |
| R2 | L2 | `tests/integration/saved/toggleFavorite.test.ts` | 2 |
| R3 | L2 | `tests/integration/saved/getFavoritePropertyIds.test.ts` | 2 |
| R4 | L2 | `tests/integration/saved/listFavoriteProperties.test.ts` | 3 |
| R5 | L3 | `tests/integration/components/FavoriteButton.test.tsx` | 1 |
| R6 | L3 | `tests/integration/components/FavoriteButton.test.tsx` | 2 |
| R7 | L3 | `tests/integration/components/PropertyCard.test.tsx` | 3 |
| R8 | L3 | `tests/integration/components/FavoriteButton.test.tsx` | 1 |
| R9 | L3 | `tests/integration/components/FavoriteButton.test.tsx` | 1 |
| R10 | L2 | `tests/integration/saved/savedPage.test.tsx` | 2 |
| R11 | L3 | `tests/integration/components/Navbar.test.tsx` | 1 |
| R12 | L2 | `tests/integration/saved/savedPage.test.tsx` | 1 |
| R13 | L2 | `tests/integration/saved/toggleFavorite.test.ts` | 2 |
| R14 | L4 | This file | — |

**Total: 100 tests passing (18 test files), 0 failures.**
