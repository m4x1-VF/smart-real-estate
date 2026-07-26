# Trazabilidad — better-auth-integration (Feature #2)

> Mapa `R<n>` → test(s) que lo verifican.

| Req | Descripción | Test(s) | Archivo |
|-----|-------------|---------|---------|
| R1 | better-auth instalado | `package.json` (dep exists) | — |
| R2 | kysely-postgres-js instalado | `package.json` (dep exists) | — |
| R3 | Instancia auth server-side | `creates the auth instance without errors using PostgresJSDialect`, `exports an auth object with an api property`, `reuses the same postgres connection from getDb()` | `tests/unit/auth/auth.test.ts` |
| R4 | authClient para Client Components | typecheck passes (`npx tsc --noEmit`) | `lib/auth/client.ts` |
| R5 | Route handler `/api/auth/[...all]` | typecheck passes | `app/api/auth/[...all]/route.ts` |
| R6 | Migración SQL tablas better-auth | `db/migrations/006_auth_tables.sql` exists | — |
| R7 | FK user_roles → user | `006_auth_tables.sql` line 62-64 | — |
| R8 | get_admin_users() actualizada | `006_auth_tables.sql` line 67-78 | — |
| R9 | Middleware: /admin/* sin sesión → /login | `redirects /admin/* to /login when no session cookie exists` | `tests/unit/auth/middleware.test.ts` |
| R10 | Middleware: /login con sesión → / | `redirects /login to / when a valid session cookie exists` | `tests/unit/auth/middleware.test.ts` |
| R11 | Middleware: validación por firma | `returns null when no session cookie is present`, `returns a string token when a valid session cookie exists`, all middleware tests | `tests/unit/auth/auth.test.ts`, `tests/unit/auth/middleware.test.ts` |
| R12 | Admin layout: validación server-side | `app/admin/layout.tsx` uses `auth.api.getSession()` + DB query | — |
| R13 | Admin layout: 403 para no-admin | `app/admin/layout.tsx` returns 403 div | — |
| R14 | Server actions: auth.api.getSession() | `app/admin/users/actions.ts` uses `auth.api.getSession()` | — |
| R15 | lib/supabase/client.ts eliminado | file does not exist | — |
| R16 | lib/supabase/server.ts eliminado | file does not exist | — |
| R17 | lib/supabase/middleware.ts eliminado | file does not exist | — |
| R18 | @supabase/ssr eliminado | `package.json` (dep absent) | — |
| R19 | types/supabase.ts eliminado | file does not exist | — |
| R20 | BETTER_AUTH_SECRET en .env.template | `.env.template` contains `BETTER_AUTH_SECRET=` | — |
| R21 | Documentación actualizada | `docs/architecture.md` + `docs/conventions.md` updated | — |
| R22 | Supabase vars eliminadas del template | `.env.template` does not contain `NEXT_PUBLIC_SUPABASE_*` | — |
| R23 | user_roles compatible con better-auth IDs | `006_auth_tables.sql` ALTER `user_roles.user_id` to `text` | — |

## Verificación

- ✅ `pnpm test:run` — 25 tests passed (4 files)
- ✅ `npx tsc --noEmit` — clean
- ✅ `pnpm lint` — clean (0 errors, 0 warnings)
