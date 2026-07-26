# `neon-db-migration` — Tasks

> Plan de implementación ejecutable. Cada `T<n>` cubre uno o más
> requisitos `R<n>` de `requirements.md`. El `implementer` marca
> `[x]` al terminar cada una. El `reviewer` rechaza si queda alguna
> `[ ]` sin justificación documentada.

Convención:
- Formato: `- [ ] T<n> — Título. Archivos: \`path\`. Cubre: R<n>, R<n>.`
- La **primera task** agrega la dependencia y documenta `DATABASE_URL`.
- La **última task** ejecuta el flujo de verificación (tests +
  typecheck + lint) — sustituye al `init.sh` que no existe en el repo;
  ver `design.md` §Riesgos #3.

---

- [x] **T1** — Agregar dependencia `postgres` a `package.json` y
  documentar `DATABASE_URL` en `.env.template`. Archivos:
  `package.json`, `.env.template`. Cubre: `R9`. La línea de
  `.env.template` se añade al final, sin valor, con comentario:

  > `DATABASE_URL=` — Cadena de conexión a Neon. Obligatoria para la
  > capa de datos. Formato: `postgres://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require`.

- [x] **T2** — Crear `lib/db/client.ts` con `getDb()` singleton,
  validación de `DATABASE_URL` y `'server-only'`. Conexión
  `postgres(...)` con `connection_limit: 1`. Archivos:
  `lib/db/client.ts` (nuevo). Cubre: `R1`, `R2`.

- [x] **T3** — Crear `types/db.ts` con `Property`, `PropertyType`,
  `UserRole`, `AppRole`, y los input types (`NewPropertyInput`,
  `UpdatePropertyInput`). Archivos: `types/db.ts` (nuevo). Cubre: `R8`.
  Marcar `types/supabase.ts` con un comment `@deprecated` que apunte a
  `types/db.ts` (mismo archivo modificado). Archivos:
  `types/supabase.ts` (modificado). Cubre: `R8`.

- [x] **T4** — Crear `lib/db/properties.ts` con las funciones de
  lectura: `listProperties(filters)` (devuelve `{ properties, totalCount }`),
  `getPropertyBySlug(slug)`, `countProperties(filters)`. Usar `getDb()`
  y SQL parametrizado (`postgres-js` template literal). Archivos:
  `lib/db/properties.ts` (nuevo). Cubre: `R3`, `R4`, `R5`, `R10`.

- [x] **T5** — Crear las funciones de escritura y toggle en
  `lib/db/properties.ts`: `insertProperty(input)`,
  `updateProperty({ id, patch })`, `togglePropertyActive(id, current)`.
  Archivos: `lib/db/properties.ts` (modificado). Cubre: `R6`, `R7`.

- [x] **T6** — Migrar `app/page.tsx` para que use
  `listProperties(filters)` en lugar de la query Supabase. Parsear
  `searchParams` igual que hoy. Pasar `page` y `pageSize` (constante
  `PAGE_SIZE = 8`) al filter. Mantener el cast a `Property[]` para
  `NewInMarket`. Archivos: `app/page.tsx` (modificado). Cubre: `R3`.

- [x] **T7** — Migrar `app/properties/[slug]/page.tsx` para que use
  `getPropertyBySlug` en `generateMetadata` y en `PropertyPage`.
  Mantener la conversión de `price` a `Intl.NumberFormat` y el manejo
  de `notFound()` cuando la prop es `null`. Archivos:
  `app/properties/[slug]/page.tsx` (modificado). Cubre: `R4`.

- [x] **T8** — Migrar `app/admin/properties/page.tsx` para que use
  `listProperties` y `countProperties` en lugar de los dos `select` de
  Supabase. Construir filtros con `searchParams`, mantener `limit = 10`
  y `from/to` como hoy, y mantener el estado activo/inactivo en UI.
  Quitar la server action inline `togglePropertyStatus`. Archivos:
  `app/admin/properties/page.tsx` (modificado). Cubre: `R5`.

- [x] **T9** — Crear server action `saveProperty` en
  `app/admin/properties/actions.ts` con `'use server'`. Recibe
  `FormData`. Decide `isEditMode` por presencia de `id` y llama a
  `insertProperty` o `updateProperty`. Mantiene el patrón
  `try / throw new Error('Failed...')` de `docs/conventions.md`.
  Llama a `revalidatePath('/admin/properties')` en éxito. Archivos:
  `app/admin/properties/actions.ts` (nuevo). Cubre: `R6`.

- [x] **T10** — Crear server action `togglePropertyActiveAction` (en
  el mismo `actions.ts` o en `toggle-active.ts` — decisión del
  implementer). Recibe `FormData` con `id` y `current`; llama a
  `togglePropertyActive()` y `revalidatePath('/admin/properties')`.
  Actualizar el `form action={...}` en `app/admin/properties/page.tsx`
  para apuntar al nuevo action. Archivos:
  `app/admin/properties/actions.ts` (nuevo),
  `app/admin/properties/page.tsx` (modificado el `<form>`).
  Cubre: `R7`.

- [x] **T11** — Migrar `app/admin/properties/[id]/edit/page.tsx` para
  que use `getPropertyBySlug` (pasando `params.id` como `slug`).
  Quitar la importación de `lib/supabase/server`. Mantener el
  `notFound()` cuando el resultado sea `null`. Archivos:
  `app/admin/properties/[id]/edit/page.tsx` (modificado). Cubre:
  `R6`.

- [x] **T12** — Actualizar `components/admin/PropertyForm.tsx` para
  invocar la server action `saveProperty` en lugar del cliente
  Supabase. Quitar `import { createClient } from '@/lib/supabase/client'`
  del path de DATOS (ver `design.md` §Riesgos #2 sobre imágenes). El
  Client Component sigue siendo `'use client'` y mantiene
  `useState<Partial<Property>>`. El `try/finally` de carga y error ya
  existe — agregar la llamada a `saveProperty(formData)` (los `FormData`
  se construyen en el handler). Archivos:
  `components/admin/PropertyForm.tsx` (modificado). Cubre: `R6`,
  `R10`.

- [x] **T13** — Crear tests unitarios para `lib/db/client.ts` y
  `lib/db/properties.ts`. Archivos:
  `tests/unit/db/client.test.ts` (nuevo),
  `tests/unit/db/properties.test.ts` (nuevo).
  Mockear `getDb()` con `vi.mock('@/lib/db/client', ...)` y assert
  sobre los argumentos que recibe la `sql\`...\`` (texto SQL +
  params). Cubre: `R1`, `R2`, `R3`, `R4`, `R5`, `R6`, `R7`, `R10`.

- [x] **T14** — Verificación final. Ejecutar en orden:
  1. `pnpm test:run`
  2. `npx tsc --noEmit`
  3. `pnpm lint`
  Todos deben pasar al 100 %. Documentar el log de salida (test
  counts y tsc exit) en `progress/impl_neon-db-migration.md`
  antes de solicitar revisión. Cubre: `R10` (regla Nivel 4 de
  `docs/verification.md`).

---

## Mapa de trazabilidad (referencia rápida)

| Requirement | Cubierto en |
|-------------|-------------|
| R1          | T2, T13 |
| R2          | T2, T13 |
| R3          | T4, T6, T13 |
| R4          | T4, T7, T13 |
| R5          | T4, T8, T13 |
| R6          | T5, T9, T11, T12 |
| R7          | T5, T10 |
| R8          | T3 |
| R9          | T1 |
| R10         | T13, T14 |

## Dependencias entre tasks (orden de ejecución)

T1 → T2 → T3 → T4 → T5 → T6 | T7 | T8 | T11 | T12 → T9 → T10 → T13 → T14

T6, T7, T8, T11 son independientes entre sí (solo comparten T4-T5). El
implementer puede secuenciarlas como prefiera; el orden sugerido
(respeta los call sites público → admin) es el listado arriba.
