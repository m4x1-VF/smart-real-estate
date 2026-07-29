# Tasks — property-favorites

> Pasos discretos en orden. El implementer marca `[x]` al completar.
> Cada task referencia al menos un `R<n>` de `requirements.md`.

## Fase 1 — Datos

- [x] T1 — Crear `db/migrations/008_favorites.sql` con la tabla
  `favorites` (PK compuesta `(user_id, property_id)`, FK a `user.id`
  text + `properties.id` uuid con `ON DELETE CASCADE`, índice por
  `user_id`). Verificar que aplica sin errores sobre una DB con las
  migraciones 001–007 ya aplicadas. Cubre: R1.
- [x] T2 — Crear `lib/db/favorites.ts` con las funciones `addFavorite`,
  `removeFavorite`, `isFavorite`, `getFavoritePropertyIds`,
  `listFavoriteProperties` usando `getDb()` y el patrón de
  `lib/db/properties.ts` (tipos `Row`, `mapRow`). Reusar
  `PROPERTY_COLUMNS` y `mapRow` de `properties.ts` para
  `listFavoriteProperties` (exportarlos si es necesario). Cubre: R1, R3, R4.
- [x] T3 — Crear `lib/favorites/schemas.ts` con `z.string().uuid()` de
  Zod v4 para validar `propertyId` (patrón de
  `lib/auth/profile-schemas.ts`). Exportar tipo `ToggleFavoriteInput`.
  Cubre: (input validation para R2/R13).

## Fase 2 — Server actions

- [x] T4 — Crear `app/saved/actions.ts` con `'use server'` y exportar
  `toggleFavorite(propertyId)`:
  1. `requireSession()` (patrón de `app/profile/actions.ts`).
  2. Validar `propertyId` con el schema Zod.
  3. `isFavorite` → `addFavorite` o `removeFavorite`.
  4. `revalidatePath('/saved')`.
  5. `return { isFavorited: boolean }`.
  Lanza `'Not authenticated'` si no hay sesión (R13/R9). Cubre: R2, R13.
- [x] T5 — Exportar `getFavoritePropertyIds(userId)` y
  `listFavoriteProperties(userId)` como wrappers de server action desde
  `app/saved/actions.ts` (re-export de `lib/db/favorites.ts`). Cubre: R3, R4.

## Fase 3 — FavoriteButton (Client Component)

- [x] T6 — Crear `components/ui/FavoriteButton.tsx` (Client Component)
  con props `propertyId`, `isFavorited`, `position`, `size`. Estado
  optimista con `useState`. Handler con `preventDefault` +
  `stopPropagation`. Llama `toggleFavorite`; en catch revierte el estado
  optimista y `router.push('/login')` si el error es de auth. Cubre: R5, R6, R8, R9.
- [x] T7 — Documentar la decisión de usar `useState` ordinario (no
  `useOptimistic` de React 19) en un comentario del componente o en
  `progress/impl_property-favorites.md`. Cubre: (design §4 alternativa descartada).

## Fase 4 — Refactor de cards

- [x] T8 — Modificar `components/ui/PropertyCard.tsx`:
  - Añadir prop `isFavorited?: boolean` (default `false`) a
    `PropertyCardProps`.
  - Reemplazar el `<button>` estático del corazón por `<FavoriteButton
    propertyId={property.id} isFavorited={isFavorited} position="top-3
    right-3" size="lg" />`.
  Cubre: R7, R8.
- [x] T9 — Modificar `components/ui/CollectionCard.tsx`:
  - Añadir prop `isFavorited?: boolean` (default `false`) a
    `CollectionCardProps`.
  - Reemplazar el `<button>` estático por `<FavoriteButton propertyId={collection.id}
    isFavorited={isFavorited} position="top-4 right-4" size="xl" />`.
  Cubre: R7, R8.

## Fase 5 — Pasar estado favorito desde Server Components

- [x] T10 — Modificar `app/page.tsx`: obtener `session` vía
  `auth.api.getSession`; si hay sesión, fetch `getFavoritePropertyIds(session.user.id)`
  → `Set<string>`. Pasar `favoriteIds` (Set) a `NewInMarket`. Cubre: R7.
- [x] T11 — Modificar `components/NewInMarket.tsx`: aceptar prop
  `favoriteIds?: Set<string>`; pasar
  `isFavorited={favoriteIds?.has(property.id) ?? false}` a cada
  `PropertyCard`. Cubre: R7.
- [x] T12 — Modificar `components/FeaturedCollection.tsx`: obtener
  sesión + `getFavoritePropertyIds`; pasar `isFavorited` a cada
  `CollectionCard`. Cubre: R7.

## Fase 6 — Página /saved + Navbar + Middleware

- [x] T13 — Crear `app/saved/page.tsx` (Server Component):
  Auth gate (`if (!session) redirect('/login')`). Fetch
  `listFavoriteProperties(session.user.id)`. Renderizar `Navbar` + grid
  de `PropertyCard` con `isFavorited={true}`. Empty state si no hay
  favoritos. Cubre: R10, R12.
- [x] T14 — Modificar `components/Navbar.tsx`: cambiar `href="#"` →
  `href="/saved"` en el link `saved_homes` de desktop (líneas 59-64) y
  mobile (líneas 134-139). Cubre: R11.
- [x] T15 — Modificar `middleware.ts`: añadir `/saved` al matcher de
  rutas que redirigen a `/login` sin cookie (consistente con `/profile` y
  `/admin/*`). Cubre: R12.

## Fase 7 — Tests (L2 + L3)

- [x] T16 — Instalar devDeps `@testing-library/react` y
  `@testing-library/user-event` (justificado en design §10). Verificar
  `vitest.config.ts` ya cubre `happy-dom` (lo hace vía
  `environmentMatchGlobs` — ver `docs/verification.md`). Cubre: (L3 habilitado).
- [x] T17 — L2: `tests/integration/saved/toggleFavorite.test.ts` — mock
  `lib/db/favorites` (insert/delete/isFavorite), mock `auth.api.getSession`.
  Casos: usuario logueado añade favorito; usuario logueado elimina
  favorito existente; usuario no autenticado lanza `'Not authenticated'`
  y no modifica DB. Cubre: R2, R13.
- [x] T18 — L2: `tests/integration/saved/getFavoritePropertyIds.test.ts`
  — mock DB. Casos: retorna IDs correctos; array vacío sin favoritos.
  Cubre: R3.
- [x] T19 — L2: `tests/integration/saved/listFavoriteProperties.test.ts`
  — mock DB. Casos: retorna propiedades completas ordenadas por
  `created_at` desc; excluye `is_active = false`; vacío si no hay
  favoritos. Cubre: R4.
- [x] T20 — L2: `tests/integration/saved/savedPage.test.tsx` — mock
  `auth.api.getSession` + `listFavoriteProperties`. Casos: sesión válida
  renderiza PropertyCards; sin sesión → `redirect('/login')`. Cubre: R10, R12.
- [x] T21 — L3: `tests/integration/components/FavoriteButton.test.tsx`
  — mock `toggleFavorite` server action + `useRouter`. Casos: renderiza
  `favorite` cuando `isFavorited=true` y `favorite_border` cuando `false`
  (R6); click alterna icono al instante (optimista) (R5); click no
  dispara navegación del `<Link>` padre (R8); server action falla con
  auth → revierte estado + `router.push('/login')` (R9). Cubre: R5, R6, R8, R9.
- [x] T22 — L3: `tests/integration/components/PropertyCard.test.tsx`
  (o ampliar el existente) — render PropertyCard con y sin
  `isFavorited`; verificar que FavoriteButton recibe la prop correcta.
  Cubre: R7.
- [x] T23 — L3: `tests/integration/components/Navbar.test.tsx` —
  verificar que ambos links `saved_homes` tienen `href="/saved"`. Cubre: R11.
- [x] T24 — L1: `tests/unit/favorites/schemas.test.ts` — validar
  `z.string().uuid()` acepta uuids válidos y rechaza strings no-uuid.
  Cubre: (input validation para R2).

## Fase 8 — Verificación & cierre

- [x] T25 — Ejecutar `./init.sh` y `pnpm test:run` — toda la suite
  verde (incluye tests de features anteriores sin regresión). Cubre: (no-regresión).
- [x] T26 — Documentar trazabilidad `R<n>` ↔ test en
  `progress/impl_property-favorites.md` con el formato de
  `docs/verification.md` §Nivel 4 (mapa explícito L1/L2/L3 por cada R).
  Cubre: R14.
- [x] T27 — Actualizar `docs/architecture.md`: añadir tabla `favorites`
  a §Estructura de Base de Datos, añadir `/saved` a §Routing, mencionar
  FavoriteButton en §UI — Componentes React. Cubre: (docs).
- [ ] T28 — Marcar status `done` en `feature_list.json` SOLO tras
  aprobación del reviewer (no automatizar). Cubre: (cierre).
