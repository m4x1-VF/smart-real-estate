# Tasks — better-auth-integration (Feature #2)

> Cada task referencia al menos un `R<n>`. El implementer marca `[x]` al completar.

## Instalación y configuración

- [x] T1 — Instalar `better-auth` y `kysely-postgres-js` como dependencias de producción (`pnpm add better-auth kysely-postgres-js`). Cubre: R1, R2.

- [x] T2 — Eliminar `@supabase/ssr` y `@supabase/supabase-js` de dependencias (`pnpm remove @supabase/ssr @supabase/supabase-js`). Cubre: R18.

- [x] T3 — Añadir `BETTER_AUTH_SECRET` a `.env.template` (sin valor). Eliminar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` del template. Cubre: R20, R22.

## Migración SQL

- [x] T4 — Crear `db/migrations/006_auth_tables.sql` con las tablas `user`, `session`, `account`, `verification`, la FK de `user_roles.user_id → user.id`, y la actualización de `get_admin_users()`. Incluir ALTER de `user_roles.user_id` de `uuid` a `text`. Cubre: R6, R7, R8, R23.

## Instancia de auth

- [x] T5 — Crear `lib/auth/index.ts` con la instancia de `betterAuth()` configurada con `PostgresJSDialect` reutilizando `getDb()` de `lib/db/client.ts`. Exportar `auth` y el tipo `Session`. Cubre: R3.

- [x] T6 — Crear `lib/auth/client.ts` con `createAuthClient()` de `better-auth/react`. Exportar `authClient`. Cubre: R4.

- [x] T7 — Crear `app/api/auth/[...all]/route.ts` con `toNodeHandler(auth)` para GET y POST. Cubre: R5.

## Middleware

- [x] T8 — Reescribir `middleware.ts` para usar `getSessionCookie()` de `better-auth/cookies` en lugar de `updateSession()` de Supabase. Implementar redirección `/admin/*` → `/login` sin sesión y `/login` → `/` con sesión. Cubre: R9, R10, R11.

## Admin layout y server actions

- [x] T9 — Actualizar `app/admin/layout.tsx` para obtener la sesión vía `auth.api.getSession()` y verificar que el email del usuario está en `get_admin_users()` de Neon. Retornar 403 si no es admin. Cubre: R12, R13.

- [x] T10 — Actualizar `app/admin/users/actions.ts` para obtener el usuario actual vía `auth.api.getSession()` en lugar de `supabase.auth.getUser()`. Cubre: R14.

- [x] T11 — Actualizar `components/LogoutButton.tsx` para usar `authClient.signOut()` en lugar de Supabase signOut. Cubre: R14 (indirecto — client-side signout).

- [x] T12 — Actualizar `app/login/page.tsx` para usar `authClient.signIn.social()` en lugar de Supabase `signInWithOAuth()`. Cubre: R5 (indirecto — login flow usa route handler).

## Limpieza de código legacy

- [x] T13 — Eliminar `lib/supabase/client.ts`. Cubre: R15.

- [x] T14 — Eliminar `lib/supabase/server.ts`. Cubre: R16.

- [x] T15 — Eliminar `lib/supabase/middleware.ts`. Cubre: R17.

- [x] T16 — Eliminar `types/supabase.ts`. Cubre: R19.

- [x] T17 — Eliminar `app/auth/callback/route.ts` (better-auth maneja callbacks en `/api/auth/*`). Verificar que no hay imports rotos.

- [x] T18 — Buscar y reemplazar cualquier import restante de `@/lib/supabase/*` o `@/types/supabase` en el codebase. Verificar con `grep` que no quedan referencias.

## Tests

- [x] T19 — Crear `tests/unit/auth/auth.test.ts` con tests que verifiquen:
  - La instancia de `auth` se crea sin errores con la configuración de `PostgresJSDialect`.
  - `getSessionCookie()` retorna `null` cuando no hay cookie de sesión.
  - `getSessionCookie()` retorna un objeto sesión cuando la cookie válida existe.
  Cubre: R3, R11.

- [x] T20 — Crear `tests/unit/auth/middleware.test.ts` con tests que verifiquen:
  - Request a `/admin/*` sin cookie de sesión → redirect a `/login`.
  - Request a `/admin/*` con cookie de sesión válida → `NextResponse.next()`.
  - Request a `/login` con cookie de sesión válida → redirect a `/`.
  Cubre: R9, R10, R11.

- [x] T21 — Ejecutar `pnpm test:run` y verificar que todos los tests (existentes + nuevos) pasan. Cubre: R1–R23 (integración).

- [x] T22 — Ejecutar `npx tsc --noEmit` y verificar que no hay errores de tipo. Cubre: R3, R4, R5, R14.

- [x] T23 — Ejecutar `pnpm lint` y verificar que no hay errores de lint. Cubre: todos (calidad de código).

## Documentación

- [x] T24 — Actualizar `docs/architecture.md`:
  - Sección "Stack": Auth → `better-auth`.
  - Sección "Adaptadores": reemplazar Supabase por `lib/auth/index.ts` y `lib/auth/client.ts`.
  - Sección "Middleware": describir `getSessionCookie()` de better-auth.
  - Sección "Flujo de Autenticación": actualizar diagrama.
  - Sección "Estructura de Base de Datos": añadir tablas `user`, `session`, `account`, `verification`.
  Cubre: R21.

- [x] T25 — Actualizar `docs/conventions.md`:
  - Reemplazar tabla "Supabase Client" por "better-auth Client".
  - Actualizar ejemplos de imports.
  Cubre: R21 (indirecto).

## Cierre

- [x] T26 — Actualizar `feature_list.json`: cambiar status de feature #2 de `pending` a `spec_ready`. (El leader lo cambiará a `in_progress` tras aprobación humana.)
