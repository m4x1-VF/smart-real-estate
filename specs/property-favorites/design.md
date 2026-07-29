# Design — property-favorites

> Decisiones técnicas para implementar los `R<n>` de `requirements.md`.
> Apóyate en `docs/architecture.md` y `docs/conventions.md` — este
> documento solo captura los puntos donde la feature roza la frontera.

## 1. Capa de datos — migración

**Archivo nuevo:** `db/migrations/008_favorites.sql`

> Nota de naming: el directorio `db/migrations/` ya contiene DOS archivos
> con prefijo `007_` (`007_auth_tables_camel_case.sql` y
> `007_fix_verification_expires_at.sql`). Para evitar conflicto y mantener
> el orden lexicográfico de ejecución, la nueva migración usa `008_`.

```sql
-- 008_favorites.sql
-- Tabla de propiedades favoritas por usuario.

create table public.favorites (
  user_id      text not null references public."user"(id) on delete cascade,
  property_id  uuid not null references public.properties(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, property_id)
);

create index favorites_user_id_idx on public.favorites (user_id);
```

**Decisiones de schema:**

- **PK compuesta `(user_id, property_id)`** — actúa como UNIQUE natural,
  prohíbe duplicados y permite `INSERT ... ON CONFLICT DO NOTHING` para
  el toggle sin race conditions. El `decisions[]` del `feature_list.json`
  ya documenta esta elección.
- **`ON DELETE CASCADE`** en ambas FK — si el usuario se borra, sus
  favoritos se borran; si la propiedad se borra, la entrada de favorito
  se borra. Evita huérfanos.
- `created_at` sin índice propio (el índice por `user_id` basta para
  listar; no se ordena por `created_at` de favorites, sino de
  properties).
- **`text`** para `user_id` (mejor-auth genera nanoids en `text`),
  **`uuid`** para `property_id` (matches `properties.id`).

## 2. Adaptador de DB — `lib/db/favorites.ts` (nuevo)

Sigue el patrón de `lib/db/properties.ts`: importa `getDb`, tipa `Row`,
función `mapRow` si hace falta, exports con nombre.

**Firmas nuevas:**

```ts
// lib/db/favorites.ts
import type { Sql } from '@/lib/db/client';
import type { Property } from '@/types/db';

export async function addFavorite(userId: string, propertyId: string): Promise<void>;
export async function removeFavorite(userId: string, propertyId: string): Promise<void>;
export async function isFavorite(userId: string, propertyId: string): Promise<boolean>;
export async function getFavoritePropertyIds(userId: string): Promise<string[]>;
export async function listFavoriteProperties(userId: string): Promise<Property[]>;
```

**Implementación clave:**

- `addFavorite` usa `INSERT ... ON CONFLICT (user_id, property_id) DO NOTHING` — idempotente.
- `removeFavorite` usa `DELETE FROM favorites WHERE user_id = $1 AND property_id = $2`.
- `isFavorite` hace `SELECT EXISTS(...)` — usado por el toggle para saber el estado actual.
- `getFavoritePropertyIds` hace `SELECT property_id FROM favorites WHERE user_id = $1` → mapea a `string[]`.
- `listFavoriteProperties` hace un JOIN:

  ```sql
  SELECT p.*
  FROM favorites f
  JOIN properties p ON p.id = f.property_id
  WHERE f.user_id = $1 AND p.is_active = true
  ORDER BY p.created_at DESC
  ```

  **Decisión:** filtra `p.is_active = true` para no mostrar al usuario
  favoritos de propiedades despublicadas. El feed público de
  properties ya filtra `is_active = true` (ver `listProperties`), así que
  `/saved` es consistente. Se reutiliza `PROPERTY_COLUMNS` y `mapRow` de
  `lib/db/properties.ts` (exportar `PROPERTY_COLUMNS` y `mapRow` o
  duplicarlos — ver Opción B abajo).

## 3. Server actions — `app/saved/actions.ts` (nuevo)

> Convención del proyecto: server actions viven junto a la página en
> `app/<route>/actions.ts` (ver `app/admin/properties/actions.ts`,
> `app/profile/actions.ts`). Como la feature gira alrededor de `/saved`,
> el archivo es `app/saved/actions.ts`.

```ts
// app/saved/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import {
  addFavorite,
  removeFavorite,
  isFavorite,
} from '@/lib/db/favorites';

export async function toggleFavorite(propertyId: string): Promise<{ isFavorited: boolean }>;
export async function getFavoritePropertyIds(userId: string): Promise<string[]>;
export async function listFavoriteProperties(userId: string): Promise<Property[]>;
```

**Decisiones:**

- **`getFavoritePropertyIds` y `listFavoriteProperties`** se re-exportan
  desde `lib/db/favorites.ts` como server actions wrapper — el patrón del
  proyecto es exponer todo vía server actions (ver
  `app/admin/properties/actions.ts` que envuelve a `lib/db/properties.ts`).
- **`toggleFavorite`** — patrón de `requireSession()` de
  `app/profile/actions.ts`:
  1. `const session = await auth.api.getSession({ headers: await headers() })`.
  2. `if (!session) throw new Error('Not authenticated')` (R13 — gate de auth, R9).
  3. `const userId = session.user.id`.
  4. `const current = await isFavorite(userId, propertyId)`.
  5. `if (current) await removeFavorite(...)` else `await addFavorite(...)`.
  6. `revalidatePath('/saved')` (las caches de listings deben refrescarse).
  7. `return { isFavorited: !current }`.
- **Validación de input**: `propertyId` es un string uuid. Validar con
  Zod v4 (`z.string().uuid()`) en `lib/auth/profile-schemas.ts` o un
  archivo nuevo `lib/favorites/schemas.ts`. Ver `lib/auth/profile-schemas.ts`
  para el patrón Zod. Si el uuid parsea falla → `throw new Error('Invalid property id')`.
- **Errores**: `throw new Error(...)` consistente con
  `app/profile/actions.ts` y `conventions.md` §Server Actions. El
  FavoriteButton client component captura el error y revierte el estado
  optimista (ver §4).

## 4. FavoriteButton — Client Component (nuevo)

**Archivo nuevo:** `components/ui/FavoriteButton.tsx`

```tsx
'use client';

import { useState, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toggleFavorite } from '@/app/saved/actions';

interface FavoriteButtonProps {
  propertyId: string;
  isFavorited: boolean;
  position?: 'top-3 right-3' | 'top-4 right-4'; // variantes por card
  size?: 'lg' | 'xl';
}

export default function FavoriteButton({ propertyId, isFavorited, position, size }: FavoriteButtonProps) {
  const [optimistic, setOptimistic] = useState(isFavorited);
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();   // R8 — no sigue el <Link>
    e.stopPropagation();  // R8 — no bubble al <Link>

    const next = !optimistic;
    setOptimistic(next);  // R5 — estado optimista inmediato
    setError(false);

    try {
      const result = await toggleFavorite(propertyId); // R2
      setOptimistic(result.isFavorited);
    } catch {
      setOptimistic(!next); // revertir
      setError(true);
      // R9 — si el error fue 'Not authenticated', redirigir a /login
      router.push('/login');
    }
  };

  const icon = optimistic ? 'favorite' : 'favorite_border'; // R6
  return (
    <button onClick={handleClick} className={/* clases según position/size */} aria-label="Toggle favorite">
      <span className={`material-icons ${size === 'xl' ? 'text-xl' : 'text-lg'} font-material-icons`}>
        {icon}
      </span>
    </button>
  );
}
```

**Decisiones:**

- **Estado optimista** (R5): se setea `optimistic` al instante tras el
  click, antes del await.
- **`preventDefault` + `stopPropagation`** (R8): ambos en el handler.
- **Redirect a /login sin auth** (R9): la server action `toggleFavorite`
  lanza `'Not authenticated'`; el catch del client revierte el optimismo
  y hace `router.push('/login')`. Alternativa descartada: que el
  FavoriteButton consulte la sesión client-side con `authClient`
  (`useSession`) antes de llamar — pero eso añade una llamada de red
  extra y la verificación autoritativa vive en el servidor. Se descarta.
- **`error` state**: para feedback visual reversible. Suficiente para
  esta feature; no se añade toast nativo (fuera de scope).
- **Posición/size variants**: PropertyCard usa `top-3 right-3` + `text-lg`;
  CollectionCard usa `top-4 right-4` + `text-xl`. Se parametrizan para no
  duplicar el componente.

### Alternativa descartada: `useOptimistic` de React 19

React 19 expone el hook `useOptimistic` para optimistic UI con server
actions. Se descarta porque:
1. El patrón该项目 ya usa `useState` + server actions en ProfileForm (`useState` para estado de carga, no optimistic).
2. `useOptimistic` requiere que la server action se use como action de `<form>` o llamada directa con transición — añade complejidad de `useTransition` que no aporta para un toggle simple de booleano.
3. Con `useState` ordinary, el revert-on-error es explícito y testeable sin mocks de `startTransition`.

Se prioriza simplicidad y consistencia con el codebase existente.

## 5. Refactor de PropertyCard y CollectionCard

### `components/ui/PropertyCard.tsx`

- Añadir prop `isFavorited?: boolean` (default `false`) a `PropertyCardProps`.
- Reemplazar el `<button>` estático (líneas 30-35) por `<FavoriteButton propertyId={property.id} isFavorited={isFavorited} position="top-3 right-3" size="lg" />`.
- **Decisión**: prop opcional (`?`) con default `false` para no romper
  usos existentes que no pasan el estado (e.g. altri componentes que
  renderizan PropertyCard sin contexto de favoritos). El default
  `favorite_border` es visualmente idéntico al comportamiento actual —
  no regresión.

### `components/ui/CollectionCard.tsx`

- Añadir prop `isFavorited?: boolean` (default `false`) a `CollectionCardProps`.
- Reemplazar el `<button>` estático (líneas 36-40) por `<FavoriteButton propertyId={collection.id} isFavorited={isFavorited} position="top-4 right-4" size="xl" />`.
- **Nota**: `Collection` (de `data/mockData.ts`) tiene `id: string`. El
  `FavoriteButton` consume `propertyId: string` — compatible.

## 6. Cómo pasar el estado inicial de favorito (Server Components)

La pregunta abierta del `feature_list.json` ("¿FavoriteButton necesita
sesión/initialFavorited pasado desde el Server Component?") se resuelve:
**el Server Component obtiene la sesión y los IDs favoritos, y le pasa
`isFavorited` booleano a cada card.** FavoriteButton nunca consulta la DB.

### Home page (`app/page.tsx`)

1. `const session = await auth.api.getSession({ headers: await headers() })`.
2. Si hay sesión: `const favoriteIds = await getFavoritePropertyIds(session.user.id)` → `Set<string>`.
3. Pasar a `NewInMarket` una prop `favoriteIds?: Set<string>`.
4. `NewInMarket` pasa `isFavorited={favoriteIds?.has(property.id) ?? false}` a cada `PropertyCard`.

### FeaturedCollection (`components/FeaturedCollection.tsx`)

- Ya es async Server Component y ya usa `getDb()` y `auth` está disponible.
- Mismo patrón: obtener sesión → `getFavoritePropertyIds` → pasar
  `isFavorited` a cada `CollectionCard`.

### Property detail (`app/properties/[slug]/page.tsx`)

- El detalle no muestra PropertyCard/CollectionCard, pero la feature
  scope no incluye el detail's favorite button. **No se toca el
  detalle en esta feature** — el corazón en el detail queda como
  extensión futura. El scope del `feature_list.json` menciona
  explícitamente PropertyCard y CollectionCard.

### `/saved` page (nuevo)

- Listado con PropertyCard; el usuario está autenticado (R12), así que
  todos son favoritos → `isFavorited={true}`.

## 7. Página /saved — `app/saved/page.tsx` (nuevo)

Server Component. Patrón de `app/profile/page.tsx` (auth gate):

```tsx
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/ui/PropertyCard';
import { listFavoriteProperties } from '@/app/saved/actions';

export default async function SavedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login'); // R12

  const properties = await listFavoriteProperties(session.user.id); // R10

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-nordic mb-8">Saved Homes</h1>
        {properties.length === 0 ? (
          <p className="text-nordic-muted">No saved properties yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} isFavorited={true} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
```

**Reutiliza el grid de NewInMarket** (responde a la segunda pregunta
abierta del `feature_list.json`: misma grilla que la home, sin filtros
ni paginación — los favoritos típicamente son pocos).

## 8. Middleware — `/saved` auth gate

`middleware.ts` actualmente redirige `/admin/*` y `/profile` sin cookie a
`/login`. **Decisión**: añadir `/saved` al matcher del middleware para
que la redirección también funcione en el edge (firma de cookie, sin DB)
en vez de solo en el layout. El layout de la página (`redirect('/login')`
si `getSession()` es null — ver §7) es el belt-and-suspenders secundario.

Esto responde R12 en dos niveles: middleware (edge, edge, optimista) +
page (node runtime, DB check autoritativo). Consistente con el patrón de
`/admin` y `/profile` ya existente.

## 9. Navbar — actualizar link `saved_homes`

`components/Navbar.tsx`:
- **Desktop** (líneas 59-64): cambiar `href="#"` → `href="/saved"`.
- **Mobile** (líneas 134-139): cambiar `href="#"` → `href="/saved"`.

El label del link viene de `dict.navbar.saved_homes` (i18n) — no se toca
el texto, solo el `href`.

## 10. Testing strategy

| Nivel | Qué | Archivo | Cobertura |
|-------|-----|---------|-----------|
| L2 | `toggleFavorite` action | `tests/integration/saved/toggleFavorite.test.ts` | R2, R13 |
| L2 | `getFavoritePropertyIds` action | `tests/integration/saved/getFavoritePropertyIds.test.ts` | R3 |
| L2 | `listFavoriteProperties` action | `tests/integration/saved/listFavoriteProperties.test.ts` | R4 |
| L2 | `/saved` page auth gate | `tests/integration/saved/savedPage.test.tsx` | R10, R12 |
| L3 | `FavoriteButton` render + click + optimistic | `tests/integration/components/FavoriteButton.test.tsx` | R5, R6, R8, R9 |
| L3 | `PropertyCard`/`CollectionCard` usan FavoriteButton | `tests/integration/components/PropertyCard.test.tsx` | R7 |
| L3 | `Navbar` links `/saved` | `tests/integration/components/Navbar.test.tsx` | R11 |
| L1 | Zod schema de `propertyId` uuid | `tests/unit/favorites/schemas.test.ts` | (input validation) |
| (DB) | migration aplicada | manual / `init.sh` | R1 |

**Mocking**: según `docs/verification.md`, los tests de server actions
mockean SOLO dependencias externas (DB client), no la lógica de negocio.
Para `toggleFavorite`, mockear `lib/db/favorites.ts` (insert/delete)
pero NO `lib/auth` (se mockea `auth.api.getSession` para simular usuario
logueado vs anónimo — `auth` es dependencia externa). Para FavoriteButton
(L3), mockear la server action `toggleFavorite` y `useRouter`.

**React Testing Library**: NO está instalado según
`docs/conventions.md`. Es NECESARIO para L3. Se debe instalar
`@testing-library/react` + `@testing-library/user-event` (devDeps) en la
fase de implementación. La convención lo anticipa ("Si una feature los
needs, primero se propone en el spec y se justifica"). Esta feature con
UI obligatoria requiere L3 → justifica el peso extra.

## 11. Archivos tocados / creados — resumen

| Archivo | Acción |
|---------|--------|
| `db/migrations/008_favorites.sql` | **CREAR** |
| `lib/db/favorites.ts` | **CREAR** |
| `app/saved/actions.ts` | **CREAR** |
| `app/saved/page.tsx` | **CREAR** |
| `components/ui/FavoriteButton.tsx` | **CREAR** |
| `lib/favorites/schemas.ts` | **CREAR** (Zod uuid validation) |
| `components/ui/PropertyCard.tsx` | **MODIFICAR** (FavoriteButton + prop) |
| `components/ui/CollectionCard.tsx` | **MODIFICAR** (FavoriteButton + prop) |
| `components/Navbar.tsx` | **MODIFICAR** (2 href `/saved`) |
| `app/page.tsx` | **MODIFICAR** (fetch favoriteIds → NewInMarket) |
| `components/NewInMarket.tsx` | **MODIFICAR** (prop favoriteIds → PropertyCard) |
| `components/FeaturedCollection.tsx` | **MODIFICAR** (fetch favoriteIds → CollectionCard) |
| `middleware.ts` | **MODIFICAR** (añadir `/saved` al matcher) |
| `docs/architecture.md` | **MODIFICAR** (añadir tabla favorites + sección /saved) |
| `package.json` | **MODIFICAR** (devDeps: `@testing-library/react`, `@testing-library/user-event`) |

> **Regla dura del spec_author**: NO se edita `src/` o `tests/` en esta
> fase. La lista de tests arriba es orientativa para el implementer; el
> spec solo define QUÉ, el implementer decide nombres finales.