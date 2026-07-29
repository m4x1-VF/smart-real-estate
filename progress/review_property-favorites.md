# Review — feature #7 property-favorites

**Veredicto:** APPROVED

## Trazabilidad requirements ↔ tests
- R1: [x] cubierto por `db/migrations/008_favorites.sql` (L1, verificado en init.sh/build)
- R2: [x] cubierto por `tests/integration/saved/toggleFavorite.test.ts` — "adds favorite when property is not yet favorited" + "removes favorite when property is already favorited"
- R3: [x] cubierto por `tests/integration/saved/getFavoritePropertyIds.test.ts` — "returns correct property IDs" + "returns empty array"
- R4: [x] cubierto por `tests/integration/saved/listFavoriteProperties.test.ts` — "returns complete properties ordered by created_at desc" + "excludes inactive" + "returns empty array"
- R5: [x] cubierto por `tests/integration/components/FavoriteButton.test.tsx` — "toggles icon optimistically on click"
- R6: [x] cubierto por `tests/integration/components/FavoriteButton.test.tsx` — "renders favorite (filled)" + "renders favorite_border (outline)"
- R7: [x] cubierto por `tests/integration/components/PropertyCard.test.tsx` — "passes isFavorited=false by default" + "passes isFavorited=true" + "passes correct position and size"
- R8: [x] cubierto por `tests/integration/components/FavoriteButton.test.tsx` — "calls preventDefault and stopPropagation on click"
- R9: [x] cubierto por `tests/integration/components/FavoriteButton.test.tsx` — "reverts optimistic state and redirects to /login on auth error"
- R10: [x] cubierto por `tests/integration/saved/savedPage.test.tsx` — "renders PropertyCards when session exists and has favorites"
- R11: [x] cubierto por `tests/integration/components/Navbar.test.tsx` — "renders saved_homes link with href="/saved" in desktop and mobile nav" (asserts 2 links)
- R12: [x] cubierto por `tests/integration/saved/savedPage.test.tsx` — "redirects to /login when no session" + `middleware.ts` adds `/saved` to protected routes
- R13: [x] cubierto por `tests/integration/saved/toggleFavorite.test.ts` — "throws 'Not authenticated' when no session" + "throws 'Invalid property id' for non-uuid"
- R14: [x] cubierto por `progress/impl_property-favorites.md` (L4 trazabilidad documentada)

## Tasks completas
- T1–T27: [x] todas marcadas completadas en `specs/property-favorites/tasks.md`
- T28: [ ] marcado `[ ]` deliberadamente — dice "SOLO tras aprobación del reviewer". Correcto.

## Checkpoints
- C1: [x] — 4 archivos base existen; 3 docs existen; tests 100/100 verdes (18 files)
- C2: [x] — `src/` no existe (proyecto usa `app/`, `components/`, `lib/`); no dependencias injustificadas (`@testing-library/react` + `@testing-library/user-event` justificadas en design §10); no `console.log` ni TODOs sueltos
- C3: [x] — tests L2 + L3 cubren todos los módulos nuevos; happy-dom en tests de componente
- C4: [x] — tests usan `vi.mock()` para DB (no mocks de `fs`); `pnpm test:run` = 100 tests verdes
- C5: [x] — no archivos temporales; `progress/` documentado; feature #7 en `in_progress` (esperando review para `done`)
- C6: [x] — `specs/property-favorites/` tiene los 3 archivos; `requirements.md` usa EARS; todas las tasks `[x]` (salvo T28 gated); cada R<n> tiene test

## Notas de calidad de implementación
- **Sin `any`**: verificado en `lib/favorites/`, `app/saved/`, `components/ui/FavoriteButton.tsx`.
- **Zod v4 correcto**: `z.string().uuid()` — validado contra zod@4.4.3 instalado.
- **Error handling consistente**: `throw new Error('Not authenticated')` / `throw new Error('Invalid property id')` — patrón idéntico a `app/profile/actions.ts`.
- **Server actions**: `app/saved/actions.ts` sigue el patrón de `requireSession()` + `auth.api.getSession({ headers: await headers() })`.
- **FavoriteButton**: usa `useState` (no `useOptimistic`) — decisión documentada en comentario del componente (líneas 7-15) y en `design.md §4`.
- **Middleware**: `/saved` añadido al gate de auth (línea 8, 13 de `middleware.ts`).
- **Navbar**: desktop (línea 60) y mobile (línea 135) ambos con `href="/saved"`.
- **docs/architecture.md**: tabla `favorites` en §Estructura BD (línea 143), `/saved` en routing (línea 346), FavoriteButton en componentes (línea 324).
