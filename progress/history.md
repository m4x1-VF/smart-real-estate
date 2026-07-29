# Bitácora histórica (append-only)

> Cada vez que se cierra una sesión, su resumen se añade aquí.
> No edites entradas anteriores. Solo añades al final.

## Sesión 2026-07-28 — `image-optimization` (feature #5) — DONE

**Estado al cerrar:** feature #5 `done`. 5/5 tareas completadas.

### Cambios realizados

1. **Función de optimización** (`lib/optimize-image.ts`)
   - `optimizeImage(file: File): Promise<Blob>` usando Canvas API
   - Redimensiona a max 1920px manteniendo aspect ratio
   - Comprime a JPEG 85% de calidad
   - Reduce imágenes de ~1.8MB a ~300-500KB

2. **Integración en PropertyForm** (`components/admin/PropertyForm.tsx`)
   - Optimización antes de llamar `uploadImage` server action
   - Preview muestra imagen optimizada
   - Manejo de errores: si falla optimización, no sube

3. **Tests unitarios** (`tests/unit/optimize-image.test.ts`)
   - 10 tests: resize grande, no resize pequeño, calidad JPEG, error handling

### Verificación
- Tests: 54/54 pasan
- Build: exitoso
- Lint: limpio

---

## Sesión 2026-07-28 — `cloudinary-image-storage` (feature #4) — DONE

**Estado al cerrar:** feature #4 `done`. 10/10 tareas completadas.

### Cambios realizados

1. **Adaptador Cloudinary** (`lib/cloudinary.ts`)
   - SDK configurado con variables de entorno
   - Función `uploadImageToCloudinary()` con validación MIME + tamaño

2. **Server action `uploadImage`** (`app/admin/properties/actions.ts`)
   - Signed upload desde servidor (API secret nunca en cliente)
   - Autenticación requerida (verifyAdminSession)

3. **Integración en PropertyForm** (`components/admin/PropertyForm.tsx`)
   - Upload real a Cloudinary al seleccionar imágenes
   - Spinner overlay durante upload
   - Manejo de errores (remueve placeholder + muestra banner)

4. **Configuración Next.js** (`next.config.ts`)
   - Dominio `res.cloudinary.com` agregado a remotePatterns

5. **Tests unitarios** (`tests/unit/cloudinary.test.ts`)
   - 5 tests: success, MIME inválido, >5MB, error Cloudinary, no auth

6. **Documentación** (`docs/architecture.md`)
   - Sección "Storage — Cloudinary" con flujo completo

### Verificación
- Tests: 44/44 pasan
- Build: exitoso
- Lint: limpio

---

## Sesión 2026-07-27 — Bugfixes post-migración y mejoras UX

**Feature:** Maintenance / Bugfixes
**Estado:** DONE

### Cambios realizados

1. **Migración 007 - CamelCase para better-auth**
   - Problema: better-auth espera columnas en camelCase (`expiresAt`, `createdAt`, `userId`, etc.) pero la migración 006 las creó en snake_case
   - Solución: Migración 007 renombra todas las columnas afectadas en tablas `user`, `session`, `account`, `verification`
   - Archivo: `db/migrations/007_auth_tables_camel_case.sql`

2. **Fix endpoint de registro**
   - Problema: `authClient.signUp.emailAndPassword()` enviaba a `/sign-up/email-and-password` (404)
   - Solución: Cambiar a `authClient.signUp.email()` que es el endpoint correcto de better-auth
   - Archivos: `app/signup/page.tsx`, `app/login/page.tsx`

3. **Avatares por defecto**
   - Problema: Usuarios sin imagen no tenían avatar
   - Solución: Crear función `generateInitialsAvatar()` que genera SVG con iniciales del usuario
   - Background fijo: `#19322F` (color de la marca)
   - Archivos: `lib/utils/avatar.ts`, `components/Navbar.tsx`, `components/admin/AdminNav.tsx`

4. **Fix imagen rota en property cards**
   - Problema: `CollectionCard` y `PropertyCard` fallaban cuando `images[0]` no existía
   - Solución: Validar existencia de imagen y mostrar placeholder con ícono de casa
   - Archivos: `components/ui/CollectionCard.tsx`, `components/ui/PropertyCard.tsx`

5. **Fix PropertyForm - imágenes no se guardaban**
   - Problema: `handleImageChange` no actualizaba `formData.images`
   - Solución: Agregar actualización de estado para incluir las URLs de las imágenes
   - Archivo: `components/admin/PropertyForm.tsx`

6. **Asignar rol admin**
   - Usuario `maxi.vilarino@gmail.com` asignado como admin en tabla `user_roles`

### Pendiente

- **Storage de imágenes**: Actualmente las URLs son blobs temporales del navegador. Necesita implementación de storage real (Supabase Storage, S3, Cloudinary, etc.)

---

## Sesión 2026-07-21 — `neon-db-migration` (feature #1) — DONE

**Estado al cerrar:** feature #1 `done`. T13 y T14 completadas.

**Trabajo realizado:**
- T13: Tests unitarios para `lib/db/client.ts` (3 tests) y `lib/db/properties.ts` (12 tests). Todos pasan.
- T14: Verificación final — `pnpm test:run` (15/15), `npx tsc --noEmit` (exit 0), `pnpm lint` (exit 0).

**Bug fix en tests:**
- El mock de `fakeSql` no manejaba correctamente las interpolaciones condicionales de postgres-js (`${sql\`is_active = true\`}`). Los tagged templates anidados consumían slots de la cola de resultados.
- Solución: distinguir entre "main queries" (SELECT/INSERT/UPDATE/DELETE) y "sub-templates" (fragmentos SQL). Solo las main queries consumen resultados. Los sub-templates retornan su texto SQL para que se interpole en el template principal.
- También se arregló el manejo de `sql(object)` para INSERT/UPDATE: ahora renderiza las keys del objeto en vez de `[object Object]`.

**Archivos modificados:**
- `tests/unit/db/properties.test.ts` — mock reescrito para manejar tagged templates anidados.
- `specs/neon-db-migration/tasks.md` — T13 y T14 marcadas `[x]`.
- `feature_list.json` — feature #1 marcada `done`.

**Próxima feature:** #2 `better-auth-integration` (pending).

---

## Sesión 2026-07-20 — `neon-db-migration` (feature #1) — EN PROGRESO, PAUSADA

**Estado al cerrar:** feature #1 `spec_ready → in_progress`. Implementación parcial: T1–T12 hechas, T13 y T14 pendientes.

**Decisiones tomadas en esta sesión:**
- ORM vs plano: `postgres-js` sin ORM.
- Pool serverless: `postgres-js` con `connection_limit=1` (Node runtime).
- `lib/supabase/*` se PRESERVAN (auth/storage los siguen usando). Se eliminan en feature #2.
- `types/supabase.ts` recibe `@deprecated`, no se elimina.
- `PropertyForm` ignora uploads nuevos; persiste metadata + URLs existentes.
- NO se crea `init.sh`. T14 sustituye por `pnpm test:run` + `npx tsc --noEmit` + `pnpm lint`.

**Spec:**
- `specs/neon-db-migration/requirements.md` — R1..R10 EARS.
- `specs/neon-db-migration/design.md` — diseño técnico, contratos, riesgos.
- `specs/neon-db-migration/tasks.md` — T1..T14 (T1–T12 marcados `[x]`, T13–T14 `[ ]`).

**Riesgos validados con el humano:**
- #1 supabase preserved (decidido).
- #2 imágenes ignoradas en PropertyForm (decidido).
- #3 no init.sh (decidido).
- #4 sin ETL (decidido).

**Próximo paso cuando se retome:**
1. Relanzar `implementer` con la misma tarea, indicando que T1–T12 ya están completas (verificar re-marcando `[x]` si hace falta).
2. Implementer debe:
   - Confirmar que cada call site (`app/page.tsx`, `app/properties/[slug]/page.tsx`, `app/admin/properties/page.tsx`, `app/admin/properties/[id]/edit/page.tsx`, `components/admin/PropertyForm.tsx`) usa ya el cliente Neon.
   - Crear `tests/unit/db/client.test.ts` y `tests/unit/db/properties.test.ts` (T13) con `vi.mock('@/lib/db/client', ...)`.
   - Ejecutar T14: `pnpm test:run`, `npx tsc --noEmit`, `pnpm lint`, y crear `progress/impl_neon-db-migration.md` con el log.
3. Lanzar `reviewer` para verificar trazabilidad R<n>↔T<n> y aprobar.
4. Marcar feature como `done` solo tras reviewer ✅ + tests verdes.
5. Mover este resumen (ya guardado en Engram #memoria_sesion) y vaciar `progress/current.md`.

**Archivos relevantes / tocados este turno:**
- `D:\Workspace\vibecoding-luxu-estate-main\specs\neon-db-migration\{requirements,design,tasks}.md`
- `D:\Workspace\vibecoding-luxu-estate-main\feature_list.json` (status #1 → `in_progress`, `decisions` actualizadas)
- `D:\Workspace\vibecoding-luxu-estate-main\.env.template` (DATABASE_URL añadido por T1)
- `D:\Workspace\vibecoding-luxu-estate-main\package.json` (dependencia `postgres` añadida por T1)
- `D:\Workspace\vibecoding-luxu-estate-main\lib\db\client.ts` (T2)
- `D:\Workspace\vibecoding-luxu-estate-main\lib\db\properties.ts` (T4–T5)
- `D:\Workspace\vibecoding-luxu-estate-main\app\admin\properties\actions.ts` (T9–T10)
- `D:\Workspace\vibecoding-luxu-estate-main\types\db.ts` (nuevo, T3)
- `D:\Workspace\vibecoding-luxu-estate-main\types\supabase.ts` (`@deprecated`, T3)
- Call sites migrados en T6–T8, T11–T12: `app/page.tsx`, `app/properties/[slug]/page.tsx`, `app/admin/properties/page.tsx`, `app/admin/properties/[id]/edit/page.tsx`, `components/admin/PropertyForm.tsx`

---

## Sesión 2026-07-21 — `better-auth-integration` (feature #2) — DONE

**Estado al cerrar:** feature #2 `done`. Implementación completa, reviewer aprobó.

**Flujo SDD seguido:**
1. `spec_author` creó spec (23 requirements, 26 tasks)
2. Humano aprobó spec
3. `implementer` ejecutó T1–T26
4. `reviewer` verificó trazabilidad R<n>↔test y aprobó

**Decisiones técnicas:**
- better-auth usa `postgres-js` vía `kysely-postgres-js` dialect (reutiliza driver de feature #1)
- Middleware usa `getSessionCookie()` de `better-auth/cookies` (firma HMAC, sin DB) — compatible con Edge Runtime
- Validación completa con DB en `app/admin/layout.tsx` (Node.js runtime) vía `auth.api.getSession()`
- Tablas de better-auth en schema `public` (mismo schema que `properties` y `user_roles`)
- `user_roles.user_id` alterado de `uuid` a `text` para compatibilidad con `user.id` de better-auth
- Route handler usa `toNextJsHandler` (no `toNodeHandler`) por compatibilidad de tipos con Next.js App Router

**Archivos creados:**
- `lib/auth/index.ts` — instancia de `betterAuth()` con PostgresJSDialect
- `lib/auth/client.ts` — `authClient` para Client Components
- `app/api/auth/[...all]/route.ts` — route handler que delega a better-auth
- `db/migrations/006_auth_tables.sql` — tablas user, session, account, verification + FK user_roles
- `tests/unit/auth/auth.test.ts` — 5 tests de configuración de auth
- `tests/unit/auth/middleware.test.ts` — 5 tests de middleware
- `progress/impl_better-auth-integration.md` — trazabilidad R1–R23 → tests
- `progress/review_better-auth-integration.md` — reporte de reviewer

**Archivos modificados:**
- `middleware.ts` — reemplazado `updateSession()` de Supabase por `getSessionCookie()` de better-auth
- `app/admin/layout.tsx` — validación server-side con `auth.api.getSession()` + check contra `get_admin_users()`
- `app/admin/users/actions.ts` — usa `auth.api.getSession()` en vez de Supabase
- `app/admin/users/page.tsx` — usa `getDb()` de Neon en vez de Supabase
- `components/LogoutButton.tsx` — usa `authClient.signOut()`
- `app/login/page.tsx` — usa `authClient.signIn.social()`
- `docs/architecture.md` — secciones de Auth, Adaptadores, Middleware, Flujo actualizadas
- `docs/conventions.md` — tabla de clientes, imports, env vars actualizados
- `.env.template` — añadido `BETTER_AUTH_SECRET`, eliminadas vars de Supabase
- `package.json` — añadido `better-auth`, `kysely-postgres-js`; eliminados `@supabase/ssr`, `@supabase/supabase-js`
- `feature_list.json` — status #2 → `done`

**Archivos eliminados:**
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `types/supabase.ts`
- `app/auth/callback/route.ts`

**Verificación:**
- `pnpm test:run` → 25 tests pasando (4 files)
- `npx tsc --noEmit` → clean
- `pnpm lint` → clean
- 0 imports de Supabase en source code

**Próxima feature:** No hay features pendientes en `feature_list.json`. El usuario puede agregar nuevas features cuando quiera.

---

## Sesión 2026-07-25 — `auth-ui` (feature #3) — DONE

**Estado al cerrar:** feature #3 `done`. Implementación completa, reviewer aprobó.

**Flujo SDD seguido:**
1. Spec ya estaba en `spec_ready` (sesión anterior 2026-07-23)
2. Humano aprobó spec
3. `implementer` ejecutó T1–T15
4. `reviewer` verificó trazabilidad R<n>↔test y aprobó

**Decisiones técnicas:**
- Zod v4.4.3 instalado (spec asumía v3). API difference: `.issues` en vez de `.errors`. Mismo comportamiento.
- `buildSocialProviders()` es función pura — testable sin DB.
- `requireEmailVerification: false` — registro directo sin verificación de email.
- `/signup` reemplaza `/register` en middleware.

**Archivos creados:**
- `lib/auth/social-providers.ts` — función pura `buildSocialProviders()`
- `lib/auth/schemas.ts` — Zod schemas `loginSchema`, `signupSchema` + tipos inferidos
- `app/signup/page.tsx` — página de registro con form + social buttons
- `tests/unit/auth/social-providers.test.ts` — 4 tests
- `tests/unit/auth/schemas.test.ts` — 8 tests
- `progress/impl_auth-ui.md` — trazabilidad R1–R17 → tests
- `progress/review_auth-ui.md` — reporte de reviewer

**Archivos modificados:**
- `lib/auth/index.ts` — social providers + `requireEmailVerification: false`
- `app/login/page.tsx` — form email/password + error handling social
- `middleware.ts` — `/register` → `/signup`
- `.env.template` — 4 vars OAuth añadidas
- `package.json` — `zod` v4.4.3 añadido
- `specs/auth-ui/tasks.md` — 15 tasks marcadas `[x]`
- `feature_list.json` — status #3 → `done`

**Verificación:**
- `pnpm test:run` → 39 tests pasando (6 files)
- `pnpm lint` → zero errors, zero warnings

**Próxima feature:** No hay features pendientes. El usuario puede agregar nuevas features cuando quiera.

---

## Sesión 2026-07-29 — `user-profile` (feature #6) — DONE

**Estado al cerrar:** feature #6 `done`. 15/15 tareas completadas.

### Cambios realizados

1. **Middleware** (`middleware.ts`)
   - `/profile` agregado a rutas protegidas (redirect a `/login` si no hay sesión)

2. **Schemas de validación** (`lib/auth/profile-schemas.ts`)
   - `updateProfileSchema`: name min 1 char
   - `changePasswordSchema`: currentPassword, newPassword min 8, confirmPassword match

3. **Adaptador Cloudinary** (`lib/cloudinary.ts`)
   - Parámetro opcional `options?: { folder?: string }` agregado
   - Default: `luxu-estate/properties/`, avatar usa `luxu-estate/avatars/`

4. **Server Actions** (`app/profile/actions.ts`)
   - `updateProfile(formData)`: actualiza nombre vía `auth.api.updateUser()`
   - `changePassword(formData)`: cambia contraseña verificando actual
   - `uploadAvatar(formData)`: sube avatar a Cloudinary, actualiza `user.image`

5. **Página /profile** (`app/profile/page.tsx`)
   - Server Component con auth gate
   - Pasa datos del usuario a `ProfileForm`

6. **Componente ProfileForm** (`components/ProfileForm.tsx`)
   - Client Component con 3 secciones: Personal Info, Avatar, Change Password
   - Avatar: preview circular, upload con optimización client-side
   - Manejo de errores con banners

7. **Navbar** (`components/Navbar.tsx`)
   - Avatar envuelto en `<Link href="/profile">` para navegación

8. **Tests L2** (`tests/unit/profile-actions.test.ts`)
   - 12 tests: updateProfile (3), changePassword (4), uploadAvatar (5)

9. **Tests L3** (`tests/unit/profile-form.test.tsx`)
   - 6 tests: renderizado, submit de formularios, manejo de errores

10. **Documentación**
    - `docs/architecture.md`: documentado /profile y server actions
    - `progress/impl_user-profile.md`: trazabilidad R↔test completa

### Verificación
- Tests: 72/72 pasan (10 files)
- Build: exitoso
- Lint: limpio
- Reviewer: aprobado (todos los checkpoints C1-C6 pasan)

### Nuevo estándar de verificación
- `docs/verification.md` actualizado: L2 (integración) y L3 (componentes) obligatorios
- Regla: no se cierra una feature sin L2 + L3 verdes
- Configurado: happy-dom + @testing-library/react + @testing-library/jest-dom + @testing-library/user-event

---

