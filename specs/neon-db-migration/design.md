# `neon-db-migration` — Design

> Decisiones técnicas para implementar los `R1`..`R10` de
> `requirements.md`. El código NO existe todavía — este documento fija
> la forma que tendrá cuando el `implementer` lo escriba.

## Resumen arquitectónico

La capa de datos deja de hablar PostgREST (Supabase) y pasa a hablar
SQL parametrizado contra Neon con `postgres-js`. El schema vive en
`db/migrations/` (asumido como dado y versionado) y los tipos
manuales viven en `types/db.ts`. La autorización, que en Supabase estaba
en RLS, pasa a server actions (R7) y a `lib/db/user-roles.ts`. Auth y
storage NO entran en esta feature — ver §Scope explícito.

```
[ Dominio ]    types/db.ts                ← tipos manuales puros
      ↓
[ Adaptadores ] lib/db/client.ts           ← singleton postgres-js
               lib/db/properties.ts       ← queries parametrizadas
               lib/db/user-roles.ts       ← helpers de authz
      ↓
[ Externa ]    app/page.tsx, app/properties/[slug]/page.tsx,
               app/admin/properties/*.tsx, app/admin/properties/.../actions.ts
```

## Archivos nuevos

```
lib/db/
  client.ts                  export getDb() singleton (R1, R2)
  properties.ts              export listProperties(), getPropertyBySlug(),
                             insertProperty(), updateProperty(),
                             togglePropertyActive(), countProperties()
  user-roles.ts              export isUserAdmin(userId), setUserRole(...)

types/
  db.ts                      export Property, PropertyType, UserRole, AppRole,
                             NewPropertyInput, PropertyUpdateInput (R8)

tests/unit/db/
  client.test.ts             cubre R1, R2
  properties.test.ts         cubre R3, R4, R5, R6, R7, R10
  user-roles.test.ts         futura feature #2 — no exigido en este spec
```

## Archivos modificados

```
package.json                  añadir dependencia `postgres` (T1)
package.json                  eliminar `@supabase/ssr` y `@supabase/supabase-js`
                              SOLO cuando auth/storage hayan migrado (feature #2)
                              — ver §Scope explícito
.env.template                 añadir DATABASE_URL= (R9)
types/supabase.ts             marcar como legacy (deprecation comment) (R8)
data/mockData.ts              sin cambios (no toca este spec, queda memoria)
app/page.tsx                  reemplazar query → listProperties() (R3)
app/properties/[slug]/page.tsx reemplazar query → getPropertyBySlug() (R4)
app/admin/properties/page.tsx reemplazar queries → listProperties() +
                              countProperties(); mover togglePropertyStatus
                              a actions.ts; revalidatePath('/admin/properties')
                              (R5, R7)
app/admin/properties/create/page.tsx
                              sin cambios funcionales; crear el stub cuando
                              aplique — el flujo usa server action de R6
app/admin/properties/[id]/edit/page.tsx
                              reemplazar query → getPropertyBySlug() (R6)
components/admin/PropertyForm.tsx
                              el Client Component deja de usar
                              `lib/supabase/client` para datos; el submit
                              llama a la server action de R6 vía
                              `useFormState` o `useTransition` (R6)
app/admin/properties/actions.ts (NUEVO)
                              server action `saveProperty(formData)` que
                              recibe FormData, llama a
                              `insertProperty()` o `updateProperty()`
                              según modo (R6)
app/admin/properties/toggle-active.ts (NUEVO, o dentro de actions.ts)
                              server action `togglePropertyActive(id, current)`
                              que llama a `togglePropertyActive()` (R7)

## Archivos eliminados en esta feature

NADIE se elimina en esta feature. Ver §Scope explícito.

## Archivos preservados (auth/storage los sigue usando)

```
lib/supabase/client.ts        PRESERVAR — `LogoutButton` y `PropertyForm`
                              siguen invocando `supabase.auth` /
                              `supabase.storage` hasta la feature #2.
lib/supabase/server.ts        PRESERVAR — middleware.ts, auth/callback,
                              admin/layout.tsx, admin/users/actions.ts
                              siguen usando `supabase.auth`.
lib/supabase/middleware.ts    PRESERVAR — Next.js `middleware.ts` lo usa.
                              AUTH es feature #2.
```

`types/supabase.ts` se CONSERVA con un bloque de cabecera así:

```typescript
/**
 * @deprecated Mantener solo por compatibilidad con auth/storage.
 * Migrar a `types/db.ts` (tipos manuales) cuando se complete la feature #2.
 */
```

## Scope explícito (lo que SÍ y lo que NO entra)

**SÍ entra:**
- Cliente `postgres-js` singleton, conexión a Neon, validación de URL.
- Reemplazo de queries de `properties` en los 4 call sites listados
  arriba (home pública, detalle, admin list, admin edit/form).
- Tipos manuales en `types/db.ts` (`Property`, `UserRole`,
  `PropertyType`, `AppRole`, inputs de insert/update).
- Documentación de `DATABASE_URL` en `.env.template`.
- Server action de guardado y de toggle de `is_active`.
- Tests unitarios sobre `lib/db/properties.ts`.

**NO entra (esta feature):**
- Reemplazo de `@supabase/ssr` ni `@supabase/supabase-js` — auth y
  storage los siguen consumiendo. Por eso los `lib/supabase/*` Y
  `package.json` (sus dependencias) se PRESERVAN.
- Cambios en `middleware.ts` — el gate de admin es feature #2.
- Cambios en `app/auth/callback/route.ts`, `components/LogoutButton.tsx`,
  `app/admin/layout.tsx`, `app/admin/users/actions.ts` — auth es
  feature #2.
- Migración de imágenes desde `supabase.storage` — fuera de scope.
- RLS en Postgres — el contrato dice "la seguridad vive en server
  actions". Esta feature NO introduce policies; lo hace el adaptador
  cuando aplique.

> JUSTIFICACIÓN: el acceptance #6 dice "queda solo si lo usa auth", lo
> que coherente con preservar los archivos y solo eliminar **el uso de
> datos** de Supabase en los call sites listados. Eliminar
> `lib/supabase/server.ts` aquí rompería `admin/layout.tsx` y
> `admin/users/actions.ts`. Ver §Riesgos explícitos al final.

## Diseño del cliente (`lib/db/client.ts`)

```typescript
import 'server-only';
import postgres from 'postgres';

type Sql = ReturnType<typeof postgres>;

let cached: Sql | null = null;

export function getDb(): Sql {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url || url === '') {
    throw new Error(
      'DATABASE_URL is required (set it in .env.local or process.env).',
    );
  }

  cached = postgres(url, {
    connection_limit: 1,        // serverless-safe
    prepare: false,             // OK en pool pequeño
    // ssl: 'require'  // Neon lo negocia por defecto si la URL incluye ?sslmode=require
  });
  return cached;
}
```

- Singleton lazy (R1).
- Validación eager de la URL en R2: lanza ANTES de ejecutar queries.
- `'server-only'` previene import accidental desde un Client Component.
- El cliente NO se inicializa en build (es lazy); las páginas que no
  llaman a `getDb()` no fallan en CI sin URL.
- Decisión: cliente único de SQL crudo; sin ORM.

### Alternativas descartadas

| Alternativa | Por qué se descarta |
|-------------|---------------------|
| `pg` (node-postgres) nativa | `postgres-js` tiene API promisificada, decimales nativos (importante porque `numeric(12,2)` se mapea a string en `pg`) y conexión pooled. |
| Drizzle ORM | Decisión explícita del proyecto: `postgres-js` sin ORM. Drizzle añadiría DSL, migraciones propias, y un `schema.ts` adicional. Incompatible con `db/migrations/*.sql` ya definidos. |
| Prisma | Igual que Drizzle; además Prisma requiere `schema.prisma` y genera un cliente pesado. |
| Uno cliente por Server Component (sin singleton) | Serverless agotaría conexiones; cada invocación abre socket. |

## Contrato de `lib/db/properties.ts`

Las funciones son **la capa de aplicación** (use cases de lectura /
escritura de propiedades). Reciben objetos planos y devuelven
`Property[]` o `Property | null`. SQL vive detrás de `getDb()`.

```typescript
import type { Property } from '@/types/db';

export interface ListPropertiesFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  beds?: number;
  baths?: number;
  page: number;          // 1-based
  pageSize: number;
}

export interface ListPropertiesResult {
  properties: Property[];
  totalCount: number;
}

export function listProperties(filters: ListPropertiesFilters):
  Promise<ListPropertiesResult>;

export function getPropertyBySlug(slug: string):
  Promise<Property | null>;

export interface PropertySlice {
  from: number;
  to: number;
}
export function countProperties(filters: Omit<ListPropertiesFilters,
  'page' | 'pageSize'>):
  Promise<number>;

export type NewPropertyInput = Omit<Property, 'id' | 'created_at'> & {
  created_at?: string;
};

export function insertProperty(input: NewPropertyInput):
  Promise<Property>;

export interface UpdatePropertyInput {
  id: string;
  patch: Partial<NewPropertyInput>;
}
export function updateProperty(input: UpdatePropertyInput):
  Promise<Property>;

export function togglePropertyActive(id: string, current: boolean):
  Promise<void>;
```

Todas las queries usan **parámetros nombrados** de `postgres-js`
(p. ej. `sql\`...WHERE slug = ${slug}\``) — nunca interpolación cruda.

## Diseño de los tipos (`types/db.ts`)

```typescript
export type PropertyType = 'sale' | 'rent';
export type AppRole = 'admin' | 'user';

export interface Property {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  price: number;             // numeric(12,2) → number en JS
  type: PropertyType;
  location: string;
  lat: number | null;
  lng: number | null;
  beds: number;
  baths: number;
  parking: number | null;
  sqft: number;
  year_built: number | null;
  images: string[];
  amenities: string[];
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;          // timestamptz → ISO string
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}
```

Decisiones de tipos:
- `Property` reemplaza a `types/property.ts`/`types/supabase.ts`. Se
  conservan sus campos actuales para no romper
  `components/ui/PropertyCard.tsx` y `components/NewInMarket.tsx`.
  Después de la feature, el único seller del modelo es `types/db.ts`:
  los call sites importan de ahí.
- `numeric(12,2)` → `number` (postgres-js devuelve string); el adaptador
  hace el cast en las funciones de lectura. Documentado en
  design-tradecisions.
- `created_at` (timestamptz) → `string` ISO (818.8 del SQL estándar).
- `property_type` y `app_role` son union literal. La skill
  `typescript` prefiere `as const`; el adaptador de tipos convive con
  el const para evitar string magic.

### Alternativas descartadas

| Alternativa | Por qué se descarta |
|-------------|---------------------|
| Generar tipos con `supabase gen types` | Estamos saliendo de Supabase. No podemos usar su CLI; un codegen con `pg-to-ts` añade tooling fuera del scope. |
| Reutilizar `Database['public']...` indefinidamente | Es el tipo autogenerado de PostgREST. Cuando el cliente cambie rompe el acoplamiento. |
| Zod para runtime-parsing | Decisión del usuario: tipos MANUALES. Zod queda fuera de scope de esta feature. |

## Diseño del form admin (`PropertyForm.tsx`)

El estado `useState<Partial<Property>>` se mantiene. El cambio funcional:

1. Quitar `import { createClient } from '@/lib/supabase/client'` (R6).
2. El `handleSubmit` deja de hacer upload directo a
   `property_images`. Como el storage de imágenes NO entra en esta
   feature, el flujo del upload se transforma así:
   - Mantener el estado local de `newImages: File[]` durante la feature
     (#1) para no romper UX.
   - El handler de submit serializa `FormData` (metadata del form +
     `Blob`/File) y lo envía a la server action `saveProperty` de
     `app/admin/properties/actions.ts`.
   - La server action todavía NO sube imágenes a ningún bucket
     (feature aparte). En esta feature, las imágenes recién añadidas
     NO se persisten — la server action solo persiste el resto del
     payload y conserva `images` (= urls ya existentes). El reviewer
     debe validar esta decisión (ver §Riesgos).
3. `handleSubmit` termina en `try/finally` con `setIsLoading(false)`,
   igual que ya estaba. Los errores hacen `setError(e.message)`.

> IMPORTANTE: la decisión de "ignorar imágenes nuevas" es un trade-off
> explícito. Migrar el upload a un bucket sin definir proveedor está
> fuera del scope. El humano debe marcarlo como decisión válida o
> proponer provider (S3/R2/Cloudinary) ya en esta feature — no se
> decide en el implementer.

## Manejo de errores

| Capa | Política |
|------|----------|
| `getDb()` | Lanza `Error` con mensaje claro si falta `DATABASE_URL` (R2). |
| `lib/db/properties.*` | Lanza `Error` envolviendo el error de Postgres; mantiene stack para debugging. NO devuelve `{ error, data }` como Supabase. |
| Server Actions (`saveProperty`, `togglePropertyActive`) | `try/catch` → `throw new Error(...)` semántico (idéntico al patrón de `docs/conventions.md`). Next.js pinta el error page. `revalidatePath()` solo en éxito. |
| Client Components | `useState<string \| null>(null)` para errores; mismo banner rojo ya existente en `PropertyForm`. |
| Server Components (páginas) | Sin try/catch (mantener convención actual). Si Neon está down, Next.js muestra error page. |

## Tests

Estrategia: **doble nivel**, según lo que se prueba:

| Tipo de test | Qué prueba | Implementación |
|--------------|------------|----------------|
| Unit (R10) | Las funciones de `lib/db/properties.ts` llaman al cliente con la SQL esperada y transforman el resultado correctamente. | **Mockear `lib/db/client.ts`** con `vi.mock` (Vitest) — devuelve filas stub. Se valida que el SQL parametrizado se construyó y que los argumentos se pasaron. Esto evita necesitar un Postgres real en CI. |
| Integration ligera | `getDb()` lanza error si falta `DATABASE_URL`. | Test puro de unit + `process.env.DATABASE_URL = ''`. |

> **Por qué mockear y NO usar `pg-mem` ni un Postgres de test:** el
> adapter de tipos manuales depende del dialecto Postgres (arrays,
> numeric, enums). `pg-mem` no soporta todos. Levantar un Postgres en
> CI añade peso (docker, pg_native build) sin valor proporcional a
> esta feature. Las funciones son thin wrappers sobre `postgres-js`;
> lo crítico (que el SQL sea correcto) se cubre en un test e2e manual
> contra la Neon real antes de marcar #1 como `done`.

### Estrategia anti-flake para `getDb()`

`getDb()` mantiene cache en módulo. El test usa `vi.resetModules()` y
re-importa el módulo en cada `it` para limpiar el cache entre
casos (URL ausente vs URL presente).

## Estructura de los archivos de tests

```
tests/unit/db/
  client.test.ts
    - throws if DATABASE_URL is empty (R2)
    - returns a singleton across calls (R1)
  properties.test.ts
    - listProperties() with no filters returns rows + count (R3)
    - listProperties() with filters passes correct args to sql (R3, R10)
    - getPropertyBySlug() returns Property | null (R4)
    - countProperties() returns number (R5)
    - insertProperty() maps fields into sql template (R6, R10)
    - updateProperty() maps patch and id into sql template (R6, R10)
    - togglePropertyActive() updates the boolean (R7, R10)
```

## Variables de entorno

| Variable | Obligatoria | Secret | Comentario |
|----------|:-----------:|:------:|------------|
| `DATABASE_URL` | sí | no | Cadena completa `postgres://...`. Documentada en `.env.template` (R9). |
| `NEXT_PUBLIC_SUPABASE_URL` | sí (de momento) | no | Sigue siendo obligatoria hasta feature #2. NO se elimina de `.env.template`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sí (de momento) | no | Igual. |

## Riesgos explícitos (requieren validación humana)

1. **No se eliminan `lib/supabase/*` en esta feature.** El codebase los
   sigue usando para auth (`middleware.ts`, `admin/layout.tsx`,
   `admin/users/actions.ts`, `LogoutButton`, `auth/callback`) y para
   storage (`PropertyForm`). ¿Apruebas dejar los archivos y la
   dependencia `@supabase/ssr` hasta feature #2? Si se prefiere
   eliminarlos YA pero dejar el cliente auth en otra ruta, el spec
   tiene que cambiar — dígalo antes de aprobar.

2. **Imágenes nuevas en `PropertyForm` no se persisten en #1.** El
   contrato dice "operaciones admin (crear, editar) escriben contra
   Neon". Sin bucket definido, la única salida honesta es:
   (a) ignorar imágenes nuevas en esta feature (mi propuesta), o
   (b) añadir un provider R2/S3 ahora (rompe "no scope creep"), o
   (c) mover el bucket Supabase Storage a un adapter `lib/storage/...`
   que conserve la URL y firma el upload contra el cliente existente
   hasta la migración del storage.
   Cualquiera de las tres es razonable; (a) es la más barata.

3. **`./init.sh` no existe** en `D:\Workspace\vibecoding-luxu-estate-main`.
   La regla "última task = ejecutar ./init.sh" no aplica literalmente.
   Sustituyo por `pnpm test:run` + `npx tsc --noEmit` + `pnpm lint`,
   que es el flujo real del repo. Si en realidad debería CREARSE un
   `init.sh` que orqueste esos tres comandos, indíquelo y lo añado a
   una task explícita.

4. **Migración de datos existentes en Supabase → Neon está fuera
   del contrato.** El spec no incluye script de ETL. Si Supabase
   tiene datos en producción que deben migrarse, esto se aborda en
   una feature ETL aparte — no en #1. (Confirmar si aplica.)

## Rollback

Si Neon falla o la migración sale mal:
- Revertir los cambios de los 4 call sites (re-volver a
  `supabase.from('properties').select(...)`).
- Mantener `lib/db/*` en git history para re-intentar más tarde.
- `DATABASE_URL` puede seguir en `.env.template` sin efecto hasta
  que el código se adapte.

El blast radius es 4 archivos (`app/page.tsx`,
`app/properties/[slug]/page.tsx`, `app/admin/properties/page.tsx`,
`app/admin/properties/[id]/edit/page.tsx`), 2 archivos nuevos
(`app/admin/properties/actions.ts`, `app/admin/properties/toggle-action.ts`)
y 1 componente cliente (`components/admin/PropertyForm.tsx`). Reversible.
