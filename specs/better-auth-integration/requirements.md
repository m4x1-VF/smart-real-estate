# Requirements — better-auth-integration (Feature #2)

> Formato EARS estricto. Cada requirement es verificable por al menos un test.

## R1 — Instalación de better-auth

El sistema DEBE incluir el paquete `better-auth` como dependencia de producción instalable vía `pnpm add better-auth`.

## R2 — Paquete kysely-postgres-js

El sistema DEBE incluir el paquete `kysely-postgres-js` como dependencia de producción para integrar `postgres-js` (driver existente) con better-auth.

## R3 — Instancia de auth server-side

El sistema DEBE exponer una instancia de `betterAuth()` desde `lib/auth/index.ts` configurada con:
- `database.dialect` = `PostgresJSDialect` usando la conexión de `getDb()` de `lib/db/client.ts`.
- `database.type` = `"postgres"`.
- `emailAndPassword.enabled` = `true`.

## R4 — Cliente de auth para Client Components

El sistema DEBE exponer una función `authClient` desde `lib/auth/client.ts` creada con `createAuthClient()` de `better-auth/react`, apuntando a `/api/auth` como base URL.

## R5 — Route handler de auth

El sistema DEBE exponer un Route Handler en `app/api/auth/[...all]/route.ts` que delegue todas las rutas a `toNodeHandler(auth)` de better-auth.

## R6 — Migración SQL de tablas better-auth

El sistema DEBE incluir una migración `db/migrations/006_auth_tables.sql` que cree las tablas `user`, `session`, `account` y `verification` en el schema `public`, con las columnas, tipos, PKs, FKs e índices que better-auth requiere.

## R7 — FK de user_roles hacia user

El sistema DEBE agregar una constraint `FOREIGN KEY` en `user_roles.user_id` que referencie `user.id` con `ON DELETE CASCADE`, reemplazando la ausencia de FK intencional de la feature #1.

## R8 — Actualización de get_admin_users()

El sistema DEBE actualizar la función SQL `get_admin_users()` para que haga `JOIN` con la tabla `user` de better-auth y devuelva el `email` real del usuario (en lugar de `''::text` como placeholder).

## R9 — Middleware: redirección de /admin/* sin sesión

CUANDO un request llega a una ruta `/admin/*` y NO existe una cookie de sesión válida de better-auth ENTONCES el sistema DEBE redirigir a `/login`.

## R10 — Middleware: redirección de /login con sesión activa

CUANDO un request llega a `/login` y existe una cookie de sesión válida de better-auth ENTONCES el sistema DEBE redirigir a `/`.

## R11 — Middleware: validación solo por firma en edge

El sistema DEBE validar la cookie de sesión en `middleware.ts` usando únicamente verificación de firma (`getSessionCookie()` de `better-auth/cookies`), sin llamadas a base de datos, para ser compatible con Edge Runtime.

## R12 — Admin layout: validación server-side con DB

CUANDO un usuario accede a `/admin/*` y el layout server-side se ejecuta, el sistema DEBE obtener la sesión completa vía `auth.api.getSession()` y verificar que el email del usuario está en el resultado de `get_admin_users()` de Neon.

## R13 — Admin layout: 403 para no-admin

SI un usuario autenticado NO tiene su email en `get_admin_users()` ENTONCES el sistema DEBE retornar un error 403 (Forbidden).

## R14 — Server actions: obtener usuario actual vía better-auth

Toda server action admin que necesite identificar al usuario actual DEBE obtenerlo vía `auth.api.getSession()` de better-auth, no vía Supabase Auth.

## R15 — Eliminación de lib/supabase/client.ts

El sistema NO DEBE contener el archivo `lib/supabase/client.ts`.

## R16 — Eliminación de lib/supabase/server.ts

El sistema NO DEBE contener el archivo `lib/supabase/server.ts`.

## R17 — Eliminación de lib/supabase/middleware.ts

El sistema NO DEBE contener el archivo `lib/supabase/middleware.ts`.

## R18 — Eliminación de @supabase/ssr

El sistema NO DEBE incluir `@supabase/ssr` como dependencia en `package.json`.

## R19 — Eliminación de types/supabase.ts

El sistema NO DEBE contener el archivo `types/supabase.ts`.

## R20 — Variable de entorno BETTER_AUTH_SECRET

El sistema DEBE documentar la variable de entorno `BETTER_AUTH_SECRET` en `.env.template` (sin valor), requerida por better-auth para firmar cookies de sesión.

## R21 — Documentación de arquitectura actualizada

El sistema DEBE actualizar `docs/architecture.md` para que la sección de Auth refleje `better-auth` como proveedor, la sección de Adaptadores liste `lib/auth/index.ts` y `lib/auth/client.ts`, y la sección de Middleware describa la validación por firma de better-auth.

## R22 — Eliminación de variables Supabase del template

El sistema NO DEBE incluir `NEXT_PUBLIC_SUPABASE_URL` ni `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.template`.

## R23 — Compatibilidad de user_roles con better-auth user IDs

El sistema DEBE garantizar que los `user_id` en `user_roles` coinciden con los `id` de la tabla `user` de better-auth (ambos `text` que contienen UUIDs), de modo que la FK y las funciones de autorización funcionen correctamente.
