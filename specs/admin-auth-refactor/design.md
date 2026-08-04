# admin-auth-refactor — Design

## 1. Problema actual

### H-05: Query ineficiente
El patrón actual en `layout.tsx`, `users/actions.ts` y `properties/actions.ts`
es idéntico y deficiente:

```sql
SELECT u.email FROM user_roles ur
JOIN public."user" u ON u.id = ur.user_id
WHERE ur.role = 'admin'
```

Esto trae **todos** los admins de la DB y compara en memoria con `Array.some()`.
Escala O(n) cuando O(1) basta. Además requiere un JOIN innecesario con la tabla
`user` solo para obtener el email.

### M-02: Sin verificación por página
Las páginas admin (`users/page.tsx`, `properties/page.tsx`, `properties/create/page.tsx`,
`properties/[id]/edit/page.tsx`) confían ciegamente en el layout para el gate de
admin. Si el layout se modifica o se introduce un route segment que lo bypasea,
los datos se sirven sin verificación.

Además, `saveProperty()` y `togglePropertyActiveAction()` en
`app/admin/properties/actions.ts` **no verifican admin** — solo `uploadImage()`
lo hace vía `verifyAdminSession()`.

### M-03: Cache-Control
Ya resuelto parcialmente por feature #10 (`next.config.ts` tiene
`Cache-Control: no-store, private` para `/admin/:path*`). Se agrega defensa
en profundidad a nivel de page component.

## 2. Archivos a crear / modificar

| Archivo | Acción | Detalle |
|---------|--------|---------|
| `lib/db/admin.ts` | **Modificar** | Reemplazar `isAdminUser(email)` por `isAdmin(userId)` con query eficiente + React `cache()` |
| `app/admin/layout.tsx` | **Modificar** | Usar `isAdmin(session.user.id)` en vez de query inline |
| `app/admin/users/actions.ts` | **Modificar** | Usar `isAdmin(session.user.id)` en `toggleUserRole` |
| `app/admin/properties/actions.ts` | **Modificar** | Extraer `requireAdmin()` compartido; agregar verificación a `saveProperty` y `togglePropertyActiveAction`; reemplazar `verifyAdminSession()` |
| `app/admin/users/page.tsx` | **Modificar** | Agregar verificación admin + Cache-Control header |
| `app/admin/properties/page.tsx` | **Modificar** | Agregar verificación admin + Cache-Control header |
| `app/admin/properties/create/page.tsx` | **Modificar** | Agregar verificación admin + Cache-Control header |
| `app/admin/properties/[id]/edit/page.tsx` | **Modificar** | Agregar verificación admin + Cache-Control header |

## 3. Firmas nuevas

### `lib/db/admin.ts`

```typescript
import { cache } from 'react';
import { getDb } from '@/lib/db/client';

/**
 * Checks if a user has admin role. Uses React cache() to deduplicate
 * within a single request lifecycle (layout + page share one DB call).
 */
export const isAdmin = cache(async (userId: string): Promise<boolean> => {
  const sql = getDb();
  const result = await sql<{ one: number }[]>`
    SELECT 1 AS one
    FROM user_roles
    WHERE user_id = ${userId}
      AND role = 'admin'
    LIMIT 1
  `;
  return result.length > 0;
});
```

### Patrón `requireAdmin()` para server actions

```typescript
// En app/admin/properties/actions.ts (y users/actions.ts)
async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  const admin = await isAdmin(session.user.id);
  if (!admin) throw new Error('Not authorized');
}
```

### Patrón de verificación en page components

```typescript
// En cada admin page.tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/db/admin';

export default async function AdminXxxPage() {
  // Defense in depth: page-level admin check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  if (!(await isAdmin(session.user.id))) {
    return <ForbiddenMessage />;  // o redirect('/admin') con status 403
  }

  // Cache-Control defense in depth
  const headersList = await headers();
  headersList.set('Cache-Control', 'no-store, private');

  // ... render data
}
```

> **Nota**: El layout ya hace el gate principal. La verificación por página
> es defense-in-depth — si el layout se modifica o un nuevo segment lo bypasea,
> la página sigue protegida. React `cache()` garantiza que layout + page
> comparten una sola query DB.

## 4. Excepciones y errores

- `isAdmin()` retorna `false` si el userId no existe en `user_roles` (no lanza).
- `requireAdmin()` lanza `Error('Not authenticated')` (401 semántico) o
  `Error('Not authorized')` (403 semántico) — consistente con el patrón actual.
- Pages retornan el componente de "forbidden" del diccionario i18n
  (`t.layout.forbidden_title` / `t.layout.forbidden_message`) en vez de lanzar,
  para mantener UX consistente con el layout.

## 5. Alternativa descartada

**Middleware global con admin check**: Mover la verificación de rol admin al
`middleware.ts` (Edge Runtime). Descartada porque:

1. El middleware corre en Edge Runtime — no tiene acceso a `getDb()` (TCP/Neon).
2. Requeriría una llamada HTTP adicional o un JWT claim custom.
3. El feature_list.json explícitamente lo marca como `out_of_scope`.
4. El patrón actual (layout + server actions) es suficiente con defense-in-depth
   a nivel de página.

**Segunda alternativa: extender sesión better-auth con campo `role`**:
Agregar un custom field `role` al session object de better-auth para evitar
la query DB entirely. Descartada porque:

1. Requiere modificar el schema de better-auth y la configuración del plugin.
2. El rol cambiaría con la sesión (stale hasta que expire o se refresque).
3. React `cache()` + cookie cache de better-auth (5 min) ya minimiza el
   impacto a 1 query DB por request, que es aceptable.

## 6. Decisiones

- **React `cache()`** para deduplicación request-level — zero-config, nativo
  de React 19, funciona con App Router.
- **`userId` como parámetro** (no email) — evita JOIN con tabla `user`,
  query más simple y rápida.
- **Cache-Control via `headers().set()`** en cada page component — defensa
  en profundidad sobre el header estático de `next.config.ts`.
- **`requireAdmin()` como función privada** en cada archivo de actions —
  no se comparte entre archivos para mantener `'use server'` isolation.
