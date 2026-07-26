# Luxu Estate — Convenciones

## Convenciones de Código

### Imports

Los imports se organizan en tres bloques, separados por una línea en blanco:

1. **Dependencias externas** (React, Next.js, librerías)
2. **Componentes locales** (relativos o `@/components/...`)
3. **Tipos y utilidades** (`@/types/...`, `@/lib/...`, `@/data/...`)

```typescript
// ✅ Correcto — Server Component
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { getDictionary } from '@/lib/i18n';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

import { Property } from '@/types/property';
```

```typescript
// ✅ Correcto — Client Component
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { authClient } from '@/lib/auth/client';

import { Property } from '@/types/property';
```

- Siempre usar path aliases `@/` para imports absolutos dentro del proyecto.
- No usar imports relativos con `../../` salvo para componentes dentro del mismo directorio (ej. `./LanguageSelector`).

### `'use client'` / `'use server'`

- **Client Components**: declaran `'use client'` como **primera línea del archivo**, antes de cualquier import.
- **Server Components**: no llevan directiva (es el default en App Router).
- **Server Actions**: archivos dedicados con `'use server'` como primera línea (ej. `app/admin/users/actions.ts`).

```typescript
// ✅ Client Component
'use client';

import { useState } from 'react';
```

```typescript
// ✅ Server Action
'use server';

import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
```

### better-auth Client

Usar el cliente correcto según el contexto:

| Contexto | Cliente |
|----------|---------|
| Server Component, RSC, Server Action | `auth` de `@/lib/auth` (para `auth.api.getSession()`) |
| Client Component (`'use client'`) | `authClient` de `@/lib/auth/client` |
| Middleware (`middleware.ts`) | `getSessionCookie()` de `better-auth/cookies` |
| DB queries (server-side) | `getDb()` de `@/lib/db/client` |

```typescript
// ✅ Server Component — obtener sesión
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect('/login');
```

```typescript
// ✅ Client Component — sign in / sign out
await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
await authClient.signOut();
```

```typescript
// ✅ Server Action — DB query directa
const sql = getDb();
const rows = await sql`SELECT * FROM properties WHERE is_active = true`;
```

### Variables de Entorno

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Neon Postgres connection string. Requerida por `lib/db/client.ts`. |
| `BETTER_AUTH_SECRET` | Secret para firmar cookies de sesión. Requerida por better-auth. |

Definidas en `.env.local`. No exponer secrets de servicio en el cliente.

### ESLint

- Flat config (`eslint.config.mjs`) con `eslint-config-next`.
- Los `eslint-disable` inline solo se usan donde Next.js o TypeScript no tienen alternativa razonable (ej. `any` en `PropertyForm` para compatibilidad con Supabase `update`).

---

## Convenciones de Nombres

### Archivos

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `PropertyCard.tsx`, `FilterModal.tsx` |
| Páginas App Router | nombres reservados Next.js | `page.tsx`, `layout.tsx`, `route.ts` |
| Utilidades / Lib | camelCase | `i18n.ts` |
| Tipos | camelCase | `property.ts`, `supabase.ts` |
| Config / Sistema | dotfiles, camelCase | `.env.local`, `middleware.ts` |

### Componentes

- **Nombre del componente = nombre del archivo**. `PropertyCard.tsx` → `PropertyCard`.
- Componentes exportados como **default export** al final del archivo.

```typescript
// ✅
const PropertyCard = ({ property }: PropertyCardProps) => {
  // ...
};

export default PropertyCard;
```

- Componentes asíncronos (Server Components) se declaran con `async function` o `const Foo = async () =>`.

```typescript
// ✅ Server Component
export default async function Home({ searchParams }: HomePageProps) {
  // ...
}

// ✅ También válido
const Navbar = async () => {
  // ...
};

export default Navbar;
```

- Componentes cliente se declaran con `function` o arrow function.

```typescript
// ✅ Client Component
export default function PropertyForm({ initialData }: PropertyFormProps) {
  // ...
}
```

### Props

- Las props se tipan con una **interfaz local** `<ComponentName>Props` definida arriba del componente.

```typescript
interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
```

- Se desestructuran en la firma del componente.
- Para Server Components con `searchParams` en páginas: `Promise<{ ... }>` (Next.js 16).

### Tipos y Interfaces

- Entidades de dominio: `interface` (ej. `Property`, `Dictionary`).
- Tipos union/enum: `type` (ej. `PropertyType = 'sale' | 'rent'`, `Locale = keyof typeof dictionaries`).
- Database schema de Supabase: `interface` con tipos generados.

```typescript
// types/property.ts
export type PropertyType = 'sale' | 'rent';

export interface Property {
  id: string;
  title: string;
  // ...
}

// types/i18n.ts
export interface Dictionary {
  navbar: NavbarDict;
  hero: HeroDict;
  // ...
}
```

### Funciones y Variables

- camelCase para funciones, variables, y handlers.
- Handlers de eventos: `handle<nombre>` (ej. `handleSubmit`, `handleInputChange`, `handleImageChange`).
- Funciones utilitarias: verbo + sustantivo (ej. `generateSlug`, `toggleAmenity`, `incrementValue`, `decrementValue`).
- Constantes globales: UPPER_SNAKE_CASE (ej. `PAGE_SIZE`, `AMENITIES_LIST`).

```typescript
const PAGE_SIZE = 8;
const AMENITIES_LIST = ['Swimming Pool', 'Garden', /* ... */];

const handleSubmit = async (e: FormEvent) => { /* ... */ };
const toggleAmenity = (id: string) => { /* ... */ };
```

### Estado (useState)

- Estado booleano de carga: `isLoading`.
- Estado de error: `error` (string | null).
- Objetos de formulario: `formData` tipado con `Partial<Entity>`.

```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [formData, setFormData] = useState<Partial<Property>>({ /* ... */ });
```

---

## Estructura de Archivos

### Componentes

```
ComponentName.tsx    # Un solo archivo por componente
```

- **No hay co-ubicación** de tests, estilos, o stories junto al componente.
- Los estilos van inline con clases Tailwind en el JSX.
- Componentes compartidos en `components/ui/`. Componentes de dominio (admin) en `components/admin/`.
- Componentes que son wrappers de lazy loading (ej. `DynamicPropertyMap`) viven en `components/` raíz.

### Hooks

Actualmente **no existen custom hooks** en el proyecto. Los componentes usan directamente `useState`, `useRouter`, `useSearchParams` de React/Next.js inline. Si se crearan, seguirían esta convención:

```
hooks/
  use-properties.ts       # camelCase, prefijo use-
  use-auth.ts
  use-debounce.ts
```

### Utilidades (lib/)

```
lib/
  auth/
    index.ts      # Instancia betterAuth() — server-only
    client.ts     # createAuthClient() — para Client Components
  db/
    client.ts     # getDb() — postgres-js singleton
  i18n.ts         # Carga de diccionarios por locale
```

- Una responsabilidad por archivo.
- Funciones exportadas con nombre (no default).

### Tipos (types/)

```
types/
  property.ts    # Entidad Property + PropertyType
  db.ts          # Tipo Database (schema PostgreSQL)
  i18n.ts        # Tipo Dictionary
```

- Un archivo por dominio/tabla.
- Solo tipos e interfaces. Sin lógica, sin imports de runtime.

### Datos (data/)

```
data/
  dictionaries/
    es.json      # Traducciones español
    en.json      # Traducciones inglés
    fr.json      # Traducciones francés
  mockData.ts    # Datos estáticos de fallback
```

- Diccionarios i18n en JSON plano, estructura idéntica entre locales.
- mockData.ts duplica interfaz `Property` — si modificas `types/property.ts`, actualizá `data/mockData.ts`.

---

## Manejo de Errores

### Server Components

No hay manejo explícito de errores. Si Supabase falla, Next.js muestra el error page por defecto. Las queries asumen éxito con fallback vacío:

```typescript
const { data: properties } = await query.range(from, to);
// properties puede ser undefined — se pasa como (properties ?? [])
```

### Client Components — Formularios

Patrón `try/catch/finally` con estado local de error:

```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  try {
    // ... operaciones Supabase
    const { error: uploadError } = await supabase.storage
      .from('property_images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;     // ← re-lanza errores de Supabase
    // ...
  } catch (err: any) {
    console.error('Error:', err);           // ← log para debugging
    setError(err.message || 'Mensaje fallback');
  } finally {
    setIsLoading(false);
  }
};
```

- Los errores de Supabase (`PostgrestError`, `StorageError`) se lanzan con `throw` para que caigan en el `catch`.
- El mensaje de error se muestra en un banner rojo dentro del formulario:

```typescript
{error && (
  <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6">
    {error}
  </div>
)}
```

- El botón de submit se deshabilita con `disabled={isLoading}` y muestra un spinner.

### Server Actions — Autorización

```typescript
export async function toggleUserRole(userId: string, currentRole: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');     // ← 401 semántico

  const sql = getDb();
  const admins = await sql`
    SELECT u.email FROM user_roles ur
    JOIN public."user" u ON u.id = ur.user_id
    WHERE ur.role = 'admin'
  `;
  const isAdmin = admins.some((a) => a.email === session.user.email);

  if (!isAdmin) {
    throw new Error('Not authorized');                   // ← 403 semántico
  }

  // ... operación
  revalidatePath('/admin/users');
}
```

- Verificación en dos pasos: autenticación (better-auth) → autorización (Neon `user_roles`).
- Errores con `throw new Error(...)` — Next.js muestra el error page automáticamente.

### Middleware — Redirecciones

```typescript
// No hay try/catch. Las redirecciones son condicionales.
if (!user && isAdminRoute) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}
```

- Sin manejo de errores explícito. La sesión se refresca silenciosamente.

### Convenciones Generales de Errores

- **No hay Error Boundaries** implementados en el proyecto.
- **No hay logging estructurado** — solo `console.error` ad-hoc.
- Los estados de error son locales al componente (`useState<string | null>`).
- Las redirecciones por falta de auth son el mecanismo principal de manejo de errores de acceso.

---

## Testing

El repositorio usa **Vitest** como runner único. Ver `docs/verification.md`
para los niveles de verificación obligatorios y los comandos exactos.

### Stack

| Herramienta | Propósito |
|-------------|-----------|
| Vitest | Unit + integration tests (runner único) |
| `@vitest/coverage-v8` | Reporte de cobertura |
| Node nativo (`node:os`, `node:fs`, `node:child_process`) | Fixtures y procesos en tests de integración |

> React Testing Library, MSW y Playwright **no están instalados**. Si una
> feature los necesita, primero se propone en el spec y se justifica el
> peso extra en dependencias.

### Ubicación de los tests

- Los tests viven en la carpeta **`tests/`** en la raíz del repo, NO
  co-ubicados con el código de producto. Esto diverge de la convención
  por defecto de Vitest y se hace así a propósito para mantener `app/`,
  `components/`, `lib/` y `types/` libres de artefactos de test.
- Estructura:

```
tests/
  unit/          # tests unitarios de funciones puras en lib/ y types/
  integration/   # tests que cruzan varios módulos o invocan el CLI
  e2e/           # smoke tests end-to-end con servidor efímero
```

- Naming: `<archivo-o-tema>.test.ts(x)`. Coincidir con el nombre del
  módulo bajo prueba cuando sea posible (ej. `tests/unit/i18n.test.ts`).

### Comandos

```bash
pnpm test          # Vitest en modo watch (desarrollo)
pnpm test:run      # Vitest una sola vez (CI / pre-commit)
pnpm test:run tests/unit
pnpm test:run tests/integration
pnpm test:run tests/e2e
pnpm test:coverage # Reporte de cobertura
```

### Convenciones

- **Directorio temporal real, nunca `mock` del fs.** Usar
  `os.tmpdir()` + `fs.mkdtempSync()` y limpiar en `afterEach` / `afterAll`
  con `fs.rmSync(..., { recursive: true, force: true })`. En Windows,
  `os.tmpdir()` ya resuelve a la carpeta Temp del usuario, no hace falta
  mapear `/tmp`.
- **Un test verifica un resultado concreto.** Quedan prohibidos los tests
  que solo comprueban "no lanza excepción".
- **Cobertura mínima por feature `sdd: true`:** cada `R<n>` de
  `specs/<name>/requirements.md` debe estar cubierto por al menos un test
  concreto (ver §Nivel 4 de `docs/verification.md`). El mapa de
  trazabilidad se documenta en `progress/impl_<name>.md`.
- **Imports de tests:** path aliases `@/` igual que el código de producto.
- **Server Components y Supabase:** los tests de integración que invocan
  Supabase deben etiquetar el archivo con `// @vitest-environment node` y
  crear fixtures con `os.tmpdir()`, no mockear el cliente.
- **No `console.log` de debug** dentro de los tests. Si necesitas salida
  para depurar, usa `vitest --reporter=verbose` y elimina el log antes de
  commitear.