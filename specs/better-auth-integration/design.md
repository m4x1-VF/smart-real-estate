# Design — better-auth-integration (Feature #2)

## Respuestas a las Open Questions

### OQ1: ¿Tablas de better-auth en el mismo schema o schema separado?

**Decisión: mismo schema `public`.**

Las tablas de better-auth (`user`, `session`, `account`, `verification`) conviven en el schema `public` junto a `properties` y `user_roles`.

**Justificación:**
- `user_roles.user_id` necesita una FK hacia `user.id` — cross-schema FKs son posibles en Postgres pero añaden complejidad innecesaria (permisos, search_path, migraciones separadas).
- Las funciones `is_admin()`, `ensure_user_role()` y `get_admin_users()` ya operan en `public` y necesitan hacer JOIN con `user` — mismo schema simplifica las queries.
- Una sola connection string, un solo `search_path`, un solo conjunto de migraciones.
- better-auth permite configurar schema via `search_path` en la connection string, pero no hay razón para separar aquí.

### OQ2: ¿Driver HTTP o TCP para better-auth?

**Decisión: TCP (`postgres-js`) para server-side, firma criptográfica para middleware edge.**

- **Server-side** (Server Components, Server Actions, Route Handlers): better-auth usa `postgres-js` vía `kysely-postgres-js` dialect. Reutiliza el driver ya instalado en feature #1 — no se añade `pg`.
- **Middleware** (Edge Runtime): NO usa driver de DB. Usa `getSessionCookie()` de `better-auth/cookies` para validación solo por firma (sin llamada a DB). Esto es el patrón recomendado por better-auth para Edge Runtime. La validación completa con DB se hace en `app/admin/layout.tsx` (Node.js runtime) vía `auth.api.getSession()`.

**Justificación:**
- Edge Runtime no soporta conexiones TCP — solo HTTP. `postgres-js` requiere TCP.
- better-auth resuelve esto con cookie cache firmada: la cookie contiene los datos de sesión + firma HMAC. `getSessionCookie()` verifica la firma sin tocar DB.
- La validación completa (DB check) vive en el layout server-side, que corre en Node.js runtime.

## Archivos a crear

| Archivo | Rol |
|---------|-----|
| `lib/auth/index.ts` | Instancia de `betterAuth()`. Server-only. Exporta `auth`. |
| `lib/auth/client.ts` | Cliente de better-auth para Client Components. Exporta `authClient`. |
| `app/api/auth/[...all]/route.ts` | Route Handler que delega a `toNodeHandler(auth)`. |
| `db/migrations/006_auth_tables.sql` | Migración SQL: tablas better-auth + FK en user_roles + update de get_admin_users(). |
| `tests/unit/auth/auth.test.ts` | Tests unitarios de la configuración de better-auth. |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `middleware.ts` | Reemplaza `updateSession()` de Supabase por `getSessionCookie()` de better-auth. |
| `app/admin/layout.tsx` | Reemplaza `supabase.auth.getUser()` por `auth.api.getSession()`. Agrega check contra `get_admin_users()`. |
| `app/admin/users/actions.ts` | Reemplaza `supabase.auth.getUser()` por `auth.api.getSession()`. |
| `app/admin/actions.ts` | Si existe y usa Supabase auth, reemplazar por better-auth. |
| `components/LogoutButton.tsx` | Reemplaza `supabase.auth.signOut()` por `authClient.signOut()`. |
| `app/login/page.tsx` | Reemplaza `signInWithOAuth()` de Supabase por `authClient.signIn.social()`. |
| `app/auth/callback/route.ts` | Eliminar o reemplazar — better-auth maneja callbacks en `/api/auth/*`. |
| `docs/architecture.md` | Actualizar secciones de Auth, Adaptadores, Middleware, Flujo de Autenticación. |
| `docs/conventions.md` | Actualizar tabla de clientes (Supabase → better-auth). |
| `.env.template` | Añadir `BETTER_AUTH_SECRET`. Eliminar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `package.json` | Añadir `better-auth`, `kysely-postgres-js`. Eliminar `@supabase/ssr`, `@supabase/supabase-js`. |
| `feature_list.json` | Status → `spec_ready`. |

## Archivos a eliminar

| Archivo | Razón |
|---------|-------|
| `lib/supabase/client.ts` | Reemplazado por `lib/auth/client.ts`. |
| `lib/supabase/server.ts` | Reemplazado por `lib/auth/index.ts`. |
| `lib/supabase/middleware.ts` | Reemplazado por lógica directa en `middleware.ts`. |
| `types/supabase.ts` | Legacy de Supabase. Los tipos de DB viven en `types/db.ts`. |

## Firmas nuevas

### `lib/auth/index.ts`

```typescript
import 'server-only';
import { betterAuth } from 'better-auth';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { getDb } from '@/lib/db/client';

export const auth = betterAuth({
  database: {
    dialect: new PostgresJSDialect({ postgres: getDb() }),
    type: 'postgres',
    transaction: false,
  },
  emailAndPassword: {
    enabled: true,
  },
  // better-auth usa BETTER_AUTH_SECRET de process.env automáticamente
});

export type Session = typeof auth.$Infer.Session;
```

### `lib/auth/client.ts`

```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
});
```

### `app/api/auth/[...all]/route.ts`

```typescript
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@/lib/auth';

export const GET = toNodeHandler(auth);
export const POST = toNodeHandler(auth);
```

### `middleware.ts` (nuevo)

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register');

  if (!sessionCookie && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (sessionCookie && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
```

### `app/admin/layout.tsx` (cambio clave)

```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/client';

export default async function AdminLayout({ children }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Check admin role against Neon
  const sql = getDb();
  const admins = await sql`
    SELECT u.email
    FROM user_roles ur
    JOIN "user" u ON u.id = ur.user_id::text
    WHERE ur.role = 'admin'
  `;
  const isAdmin = admins.some((a) => a.email === session.user.email);

  if (!isAdmin) {
    // 403 — forbidden
    return <ForbiddenPage />;
  }

  return children;
}
```

## Migración SQL: `db/migrations/006_auth_tables.sql`

```sql
-- 006_auth_tables.sql
-- Tablas de better-auth + integración con user_roles existente.

-- 1. Tabla user (better-auth core)
create table public."user" (
  id             text primary key,
  name           text not null,
  email          text not null unique,
  email_verified boolean not null default false,
  image          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 2. Tabla session
create table public.session (
  id         text primary key,
  expires_at timestamptz not null,
  token      text not null unique,
  ip_address text,
  user_agent text,
  user_id    text not null references public."user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index session_user_id_idx on public.session (user_id);

-- 3. Tabla account
create table public.account (
  id                       text primary key,
  account_id               text not null,
  provider_id              text not null,
  user_id                  text not null references public."user"(id) on delete cascade,
  access_token             text,
  refresh_token            text,
  id_token                 text,
  access_token_expires_at  timestamptz,
  refresh_token_expires_at timestamptz,
  scope                    text,
  password                 text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index account_user_id_idx on public.account (user_id);

-- 4. Tabla verification
create table public.verification (
  id         text primary key,
  identifier text not null,
  value      text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index verification_identifier_idx on public.verification (identifier);

-- 5. FK de user_roles hacia user (reemplaza la ausencia intencional de feature #1)
alter table public.user_roles
  add constraint user_roles_user_id_fk
  foreign key (user_id) references public."user"(id) on delete cascade;

-- 6. Actualizar get_admin_users() para JOIN con user table
create or replace function public.get_admin_users()
returns table (id uuid, email text, role public.app_role)
language sql
stable
security definer
set search_path = public
as $$
  select ur.user_id, u.email, ur.role
  from public.user_roles ur
  join public."user" u on u.id = ur.user_id::text
  where ur.role = 'admin';
$$;
```

## Alternativa descartada: `pg.Pool` como driver

**Opción considerada:** Instalar `pg` y usar `Pool` como driver de better-auth (es el ejemplo más común en la docs).

**Por qué se descarta:**
- El proyecto ya usa `postgres-js` (feature #1). Instalar `pg` significa dos drivers Postgres, dos pools de conexión, dos dependencias que mantener.
- better-auth soporta `postgres-js` vía `kysely-postgres-js` dialect — mismo resultado, cero dependencias nuevas de driver.
- `postgres-js` es más liviano y tiene mejor soporte serverless (connection pooling nativo).

## Alternativa descartada: `betterFetch` en middleware

**Opción considerada:** Usar `betterFetch` para llamar a `/api/auth/get-session` desde el middleware edge, obteniendo la sesión completa con DB check.

**Por qué se descarta:**
- Añade latencia (HTTP roundtrip) en cada request al middleware.
- `getSessionCookie()` es más rápido (solo verifica firma HMAC, sin DB ni HTTP).
- La validación completa con DB se hace en el layout server-side (belt-and-suspenders), así que el middleware solo necesita el check optimista.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| `user_roles.user_id` es `uuid` pero `user.id` es `text` | La FK usa `user_id::text` cast, o se cambia el tipo de `user_roles.user_id` a `text`. En la migración 006 se hace el cast explícito. Si Postgres rechaza la FK por tipo mismatch, se altera `user_roles.user_id` a `text`. |
| better-auth genera IDs en formato nanoid (no UUID) | `user.id` es `text` — acepta cualquier formato. `user_roles.user_id` necesita almacenar el mismo string. Se verifica en tests que el JOIN funciona. |
| Edge Runtime no soporta `postgres-js` | Mitigado: middleware usa solo `getSessionCookie()` (sin DB). Full validation en layout (Node.js runtime). |
| Migración de usuarios existentes de Supabase Auth | Fuera de scope (ver `out_of_scope` en feature_list.json). Se documenta como trabajo futuro. |
| `BETTER_AUTH_SECRET` no configurado en dev | better-auth falla al arrancar si no existe. Se documenta en `.env.template` y en `docs/architecture.md`. |

## Dependencia de tipos: `user_roles.user_id` ↔ `user.id`

La tabla `user_roles` tiene `user_id uuid` y better-auth crea `user.id text`. Para la FK:
- Opción A: Cambiar `user_roles.user_id` de `uuid` a `text` en la migración 006.
- Opción B: Mantener `uuid` y usar cast en queries (no permite FK nativa).

**Decisión: Opción A.** La migración 006 altera `user_roles.user_id` a `text` antes de agregar la FK. Esto es limpio y permite que better-auth guarde su ID nativo (text/nanoid) sin conversión.

> **Nota para el implementer**: verificar si `user_roles` tiene datos en producción. Si los hay, se necesita un script de migración de datos. En este punto del proyecto (dev), la tabla está vacía — el ALTER es seguro.
