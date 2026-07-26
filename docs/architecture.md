# Luxu Estate — Architecture

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 + React 19 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Database | PostgreSQL (Neon) |
| Auth | better-auth (session cookies + Neon-backed user/session/account/verification tables) |
| Validation | Zod (schemas para formularios auth: `loginSchema`, `signupSchema`) |
| Maps | Leaflet / react-leaflet |
| Icons | Lucide React |
| Testing | Vitest |
| Package Manager | pnpm |

## Comandos

```bash
pnpm dev          # Servidor desarrollo :3000
pnpm build        # Build producción
pnpm lint         # ESLint (flat config, eslint-config-next)
pnpm test         # Tests con Vitest
```

No hay script de typecheck — ejecutar `npx tsc --noEmit` manualmente.

## Estructura de Base de Datos

PostgreSQL gestionado por **Neon**. El schema vive en el schema público (`public`) y se versiona en `db/migrations/`. Las migraciones se numeran con prefijo `NNN_` y se ejecutan en orden.

### Enums

| Enum | Valores | Usado por |
|------|---------|-----------|
| `property_type` | `'sale'`, `'rent'` | `properties.type` |
| `app_role` | `'admin'`, `'user'` | `user_roles.role` |

### Tablas

#### `properties`

Catálogo de propiedades inmobiliarias publicadas en el sitio.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|:----:|---------|-------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | PK |
| `title` | `text` | ❌ | — | Título público |
| `description` | `text` | ✅ | — | Descripción larga |
| `price` | `numeric(12,2)` | ❌ | — | `CHECK (price >= 0)` |
| `type` | `property_type` | ❌ | — | Venta o alquiler |
| `location` | `text` | ❌ | — | Dirección legible |
| `lat` | `numeric(9,6)` | ✅ | — | Latitud (WGS84) |
| `lng` | `numeric(9,6)` | ✅ | — | Longitud (WGS84) |
| `beds` | `integer` | ❌ | — | `CHECK (beds >= 0)` |
| `baths` | `integer` | ❌ | — | `CHECK (baths >= 0)` |
| `parking` | `integer` | ✅ | — | `CHECK (parking >= 0)` |
| `sqft` | `integer` | ❌ | — | `CHECK (sqft >= 0)` |
| `year_built` | `integer` | ✅ | — | `CHECK (year_built between 1800 and extract(year from now())::int + 1)` |
| `images` | `text[]` | ❌ | `'{}'` | URLs de imágenes |
| `amenities` | `text[]` | ❌ | `'{}'` | Lista de amenidades |
| `is_active` | `boolean` | ❌ | `true` | Visibilidad pública |
| `is_featured` | `boolean` | ❌ | `false` | Destacada en home |
| `is_new` | `boolean` | ❌ | `true` | Marca "nueva" |
| `slug` | `text` | ✅ | — | UNIQUE — URL semántica |
| `created_at` | `timestamptz` | ❌ | `now()` | Creación |

**Índices**: `is_active`, `is_featured`, `type`, `price`, `created_at desc`.

#### `user_roles`

Relación usuario → rol para autorización. Una fila por usuario.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|:----:|---------|-------|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | PK |
| `user_id` | `text` | ❌ | — | UNIQUE — FK → `user.id` (better-auth) |
| `role` | `app_role` | ❌ | `'user'` | RBAC |

**Índices**: `user_id`.

#### `user` (better-auth)

Usuarios autenticados. Creada por `db/migrations/006_auth_tables.sql`.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|:----:|---------|-------|
| `id` | `text` | ❌ | — | PK (nanoid generado por better-auth) |
| `name` | `text` | ❌ | — | Nombre del usuario |
| `email` | `text` | ❌ | — | UNIQUE |
| `email_verified` | `boolean` | ❌ | `false` | |
| `image` | `text` | ✅ | — | URL de avatar |
| `created_at` | `timestamptz` | ❌ | `now()` | |
| `updated_at` | `timestamptz` | ❌ | `now()` | |

#### `session` (better-auth)

Sesiones activas. FK → `user.id` ON DELETE CASCADE.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|:----:|---------|-------|
| `id` | `text` | ❌ | — | PK |
| `expires_at` | `timestamptz` | ❌ | — | |
| `token` | `text` | ❌ | — | UNIQUE |
| `user_id` | `text` | ❌ | — | FK → `user.id` |
| `ip_address` | `text` | ✅ | — | |
| `user_agent` | `text` | ✅ | — | |
| `created_at` | `timestamptz` | ❌ | `now()` | |
| `updated_at` | `timestamptz` | ❌ | `now()` | |

#### `account` (better-auth)

Cuentas OAuth conectadas (Google, GitHub). FK → `user.id` ON DELETE CASCADE.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|:----:|---------|-------|
| `id` | `text` | ❌ | — | PK |
| `account_id` | `text` | ❌ | — | ID del provider |
| `provider_id` | `text` | ❌ | — | `google`, `github`, etc. |
| `user_id` | `text` | ❌ | — | FK → `user.id` |
| `access_token` | `text` | ✅ | — | |
| `refresh_token` | `text` | ✅ | — | |
| `id_token` | `text` | ✅ | — | |
| `scope` | `text` | ✅ | — | |
| `password` | `text` | ✅ | — | Para email/password |
| `created_at` | `timestamptz` | ❌ | `now()` | |
| `updated_at` | `timestamptz` | ❌ | `now()` | |

#### `verification` (better-auth)

Tokens de verificación (email verification, password reset).

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|:----:|---------|-------|
| `id` | `text` | ❌ | — | PK |
| `identifier` | `text` | ❌ | — | Indexed |
| `value` | `text` | ❌ | — | |
| `expires_at` | `timestamptz` | ❌ | — | |
| `created_at` | `timestamptz` | ❌ | `now()` | |
| `updated_at` | `timestamptz` | ❌ | `now()` | |

### Funciones SQL

| Función | Returns | Estabilidad | Notas |
|---------|---------|-------------|-------|
| `is_admin()` | `boolean` | `STABLE` | `true` si el usuario actual (`app.current_user_id` GUC) tiene `role = 'admin'` |
| `ensure_user_role()` | `void` | `VOLATILE` | Inserta fila `'user'` si no existe para el usuario actual |
| `get_admin_users()` | `table(id text, email text, role app_role)` | `STABLE` | JOIN con tabla `user` de better-auth para devolver email real |

Las tres son `SECURITY DEFINER` con `search_path = public`. Reciben el usuario desde la GUC `app.current_user_id` (string UUID), seteada por el adaptador en cada request.

### Decisiones de diseño

- **`numeric` para dinero y coordenadas** — nunca `float` ni `real`.
- **Precios como `numeric(12,2)`** — soporta hasta `9 999 999 999.99`, suficiente para inmuebles en USD/EUR.
- **`text[]` para `images` y `amenities`** — listas chicas, evita una tabla relacional. Si crece (variantes por idioma, orden custom), migrar a `property_images` y `property_amenities`.
- **`uuid` como PK en `properties`** — generado en DB con `pgcrypto` (`gen_random_uuid()`). No se generan IDs en la app.
- **`text` como PK en `user`** — better-auth genera IDs tipo nanoid. `user_roles.user_id` fue alterado de `uuid` a `text` para admitir FK nativa hacia `user.id`.
- **FK en `user_roles.user_id`** → `user.id` ON DELETE CASCADE (migración 006).
- **Sin RLS** — la seguridad vive en server actions y route handlers. Si más adelante se necesita aislamiento por usuario, se agrega RLS con la GUC `app.current_user_id`.
- **Storage de imágenes externo** — `images` guarda URLs; los archivos viven fuera de Postgres (proveedor a definir).

### Archivos de migración

```
db/migrations/
  001_extensions.sql      # pgcrypto
  002_enums.sql           # property_type, app_role
  003_properties.sql      # tabla + índices + checks
  004_user_roles.sql      # tabla + índices
  005_functions.sql       # is_admin, ensure_user_role, get_admin_users
  006_auth_tables.sql     # tablas better-auth (user, session, account, verification) + FK user_roles → user + update funciones
```

Orden de ejecución: `001 → 002 → 003 → 004 → 005 → 006`.

## Clean Architecture Layers

El proyecto sigue los principios de **Clean Architecture** (Hexagonal / Ports & Adapters). Las capas están organizadas por dependencia unidireccional — las capas internas nunca conocen las externas.

```
[ Dominio ]                  Reglas de negocio puras, sin dependencias externas
    ↓ depende de
[ Casos de Uso ]             Orquestación de operaciones (aplicación)
    ↓ depende de
[ Adaptadores ]              Implementaciones concretas (Supabase, SSR, i18n)
    ↓ depende de
[ Externa ]                  Frameworks, runtime, drivers (Next.js, React, Leaflet)
```

### 1. Capa de Dominio (`types/`)

La capa más interna. Define entidades y reglas de negocio sin dependencias externas.

| Archivo | Rol |
|---------|-----|
| `types/property.ts` | Entidad `Property` — tipo canónico con todos los campos del dominio inmobiliario (`id`, `title`, `slug`, `location`, `price`, `images`, `beds`, `baths`, `sqft`, `type`, `is_new`, `is_featured`, `is_active`, `lat`, `lng`, `description`, `year_built`, `parking`, `amenities`) |
| `types/db.ts` | Tipo `Database` — schema PostgreSQL para postgres-js (tablas `properties`, `user_roles`, `user`, `session`, `account`, `verification`) |
| `types/i18n.ts` | Tipo `Dictionary` — forma del diccionario de traducciones (secciones: `navbar`, `hero`, `common`, `property_detail`) |

- Estas definiciones son **puras TypeScript**. No importan React, Next.js, ni Supabase.
- `Property` es la entidad central del dominio. Todo caso de uso opera sobre este tipo.

### 2. Capa de Casos de Uso (en desarrollo)

Actualmente la lógica de aplicación **reside inline en Server Components y Client Components** (llamadas directas a Supabase sin abstracción). Está planificada su extracción a esta capa.

| Caso de Uso | Ubicación actual | Responsabilidad |
|-------------|------------------|----------------|
| Listar propiedades con filtros + paginación | `app/page.tsx` | Query SQL con `ILIKE`, `LIMIT/OFFSET` |
| Ver detalle de propiedad | `app/properties/[slug]/page.tsx` | Fetch por slug |
| Crear / Editar propiedad | `components/admin/PropertyForm.tsx` | Insert/Update vía server action |
| Administrar roles de usuario | `app/admin/users/actions.ts` | Toggle admin role con verificación de autorización |
| Gestionar sesión de autenticación | `components/LogoutButton.tsx` | Sign out (better-auth) |
| Login (email/password + social) | `app/login/page.tsx` | Zod validation + `authClient.signIn.emailAndPassword()` / `authClient.signIn.social()` |
| Registro (email/password + social) | `app/signup/page.tsx` | Zod validation + `authClient.signUp.emailAndPassword()` / `authClient.signIn.social()` |

### 3. Capa de Adaptadores (`lib/`)

Implementaciones concretas de puertos. Traducen entre el mundo externo y el dominio.

| Adaptador | Archivo | Implementa |
|-----------|---------|------------|
| better-auth Server | `lib/auth/index.ts` | Instancia `betterAuth()` con `PostgresJSDialect` sobre `getDb()`. Server-only. Exporta `auth`. |
| better-auth Client | `lib/auth/client.ts` | `createAuthClient()` de `better-auth/react`. Para Client Components. Exporta `authClient`. |
| Social providers | `lib/auth/social-providers.ts` | Función pura `buildSocialProviders()` — lee env vars de Google/GitHub y retorna config para `betterAuth()`. |
| Auth schemas (Zod) | `lib/auth/schemas.ts` | `loginSchema`, `signupSchema` — validación client-side de formularios. Tipos inferidos: `LoginInput`, `SignupInput`. |
| Neon (postgres-js) | `lib/db/client.ts` | Conexión directa a Neon. `getDb()` retorna instancia singleton de `postgres-js`. |
| i18n | `lib/i18n.ts` | Carga de diccionarios estáticos por locale (es/en/fr) |

#### better-auth — Detalles

- **Variables de entorno**: `BETTER_AUTH_SECRET` (firma de cookies), `DATABASE_URL` (Neon), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (OAuth social).
- **Social providers**: Google y GitHub configurados vía `buildSocialProviders()` en `lib/auth/social-providers.ts`. La función lee env vars y retorna el objeto `socialProviders` para `betterAuth()`.
- **Validación de formularios**: Schemas Zod en `lib/auth/schemas.ts` (`loginSchema`, `signupSchema`). Tipos inferidos: `LoginInput`, `SignupInput`. Usados en `/login` y `/signup` para validación client-side antes de llamar a `authClient`.
- Server-side: `import { auth } from '@/lib/auth'` → `auth.api.getSession({ headers })` para obtener sesión completa con DB check.
- Client-side: `import { authClient } from '@/lib/auth/client'` → `authClient.signIn.social()`, `authClient.signIn.emailAndPassword()`, `authClient.signUp.emailAndPassword()`, `authClient.signOut()`.
- Route handler: `app/api/auth/[...all]/route.ts` delega a `toNextJsHandler(auth)`.
- Middleware: `getSessionCookie(request)` de `better-auth/cookies` — validación solo por firma (Edge-compatible, sin DB).

#### i18n — Detalles

- Locale almacenado en cookie `NEXT_LOCALE` (default: `'es'`).
- Soportados: `es`, `en`, `fr`.
- Para cambiar locale, setear la cookie — `components/LanguageSelector.tsx` lo maneja.
- `lib/i18n.ts` carga diccionarios de `data/dictionaries/{locale}.json`.
- Diccionarios estáticos en `data/dictionaries/` — `en.json`, `es.json`, `fr.json`.

#### Datos estáticos

- `data/mockData.ts` — datos de fallback. **Atención**: define su propia interfaz `Property`. Si se modifica `types/property.ts`, actualizar también `mockData.ts`.

### 4. Capa Externa (`app/`, `components/`, `middleware.ts`)

Frameworks, UI, runtime y mecanismos de entrega.

#### Routing — Next.js App Router

```
app/
  layout.tsx                    # Root layout (Inter font, Material Icons CDN)
  page.tsx                      # Home — SSR con filtros + paginación (PAGE_SIZE = 8, backend-driven)
  login/                        # Login (email/password + social: Google/GitHub) vía better-auth
  signup/                       # Registro (email/password + social: Google/GitHub) vía better-auth
  properties/[slug]/            # Detalle de propiedad (SSR)
  admin/                        # Panel admin (protegido)
    layout.tsx                  # Server-side auth gate (auth.api.getSession + get_admin_users)
    properties/                 # CRUD de propiedades
    users/                      # Gestión de roles
  api/auth/[...all]/            # Route Handler — better-auth (toNextJsHandler)
```

#### UI — Componentes React

```
components/
  ui/                           # Componentes compartidos
    PropertyCard.tsx
    CollectionCard.tsx
    FilterModal.tsx
    LanguageSelector.tsx        # Selector de idioma (cookie NEXT_LOCALE)
    FeaturedCollection.tsx      # Colección destacada (SSR)
    Navbar.tsx                  # Navegación principal (SSR)
    Footer.tsx
    Spinner.tsx
    LogoutButton.tsx            # Cierre de sesión
  admin/                        # Panel admin
    AdminNav.tsx
    PropertyForm.tsx            # Formulario crear/editar (sin librería de forms, solo useState)
  PropertyMap.tsx               # Mapa Leaflet — SOLO cliente, importar con next/dynamic(ssr: false)

app/
  login/page.tsx                # Login (email/password + social) — Client Component, validación Zod
  signup/page.tsx               # Registro (email/password + social) — Client Component, validación Zod
```

#### Middleware

`middleware.ts` ejecuta `getSessionCookie(request)` de `better-auth/cookies` en cada request (excepto static assets):

1. Verifica firma HMAC de la cookie de sesión (sin llamada a DB — Edge-compatible)
2. Redirige `/admin/*` sin cookie → `/login`
3. Redirige `/login` con cookie → `/`
4. Redirige `/signup` con cookie → `/`
4. Validación completa con DB se hace en `app/admin/layout.tsx` (Node.js runtime) vía `auth.api.getSession()` + check contra `get_admin_users()`

#### Estilo — Design Tokens (Tailwind v4)

Definidos en `app/globals.css` como `@theme inline`. Usar solo estos tokens semánticos:

| Token | Hex | Uso |
|-------|-----|-----|
| `bg-clear-day` | `#EEF6F6` | Fondos de página |
| `text-nordic` | `#19322F` | Texto, headings |
| `bg-mosque` | `#006655` | Botones primarios / CTAs |
| `text-mosque` | `#006655` | Links / texto de acento |
| `bg-hint-of-green` | `#D9ECC8` | Cards/sections destacadas |
| `text-nordic-muted` | `#5C706D` | Texto secundario |

Font: `font-display` (Inter via `--font-display`). El design spec de `antigravity/guidelines.md` especifica SF Pro Display; el codebase actual usa Inter. Si se cambia la fuente, seguir el design spec.

## Flujo de Autenticación

```
Usuario → /login o /signup
       → Formulario email/password → validación Zod (loginSchema/signupSchema)
       → authClient.signIn.emailAndPassword() o authClient.signUp.emailAndPassword()
       → /api/auth/* → better-auth route handler (toNextJsHandler)
       → cookie de sesión firmada (better-auth.session_token)
       → middleware.ts → getSessionCookie() verifica firma (sin DB)
       → /admin/* → layout.tsx → auth.api.getSession() (DB check) + get_admin_users() (autorización)

Usuario → /login → authClient.signIn.social({ provider: 'google' | 'github' })
       → Redirect a OAuth provider → callback /api/auth/callback/{provider}
       → better-auth crea/actualiza cuenta → cookie de sesión
       → redirect a /
```

- **Validación client-side**: Schemas Zod (`loginSchema`, `signupSchema`) en `lib/auth/schemas.ts`. Validación antes de llamar a `authClient`.
- **Social auth**: Google y GitHub configurados vía `buildSocialProviders()` en `lib/auth/social-providers.ts`.
- Doble verificación en admin: middleware (firma de cookie, optimista) + layout (validación completa con DB). Estrategia belt-and-suspenders.
- `getSessionCookie()` es Edge-compatible (sin TCP/DB). `auth.api.getSession()` corre en Node.js runtime.

## Flujo de Datos

### Lectura (Server Components)

```
app/page.tsx
  → lib/db/client.ts (getDb)
  → postgres-js: SELECT ... FROM properties WHERE ... ORDER BY ... LIMIT ... OFFSET ...
  → Property[]
  → renderiza PropertyCard, FeaturedCollection
```

- Paginación backend-driven: `PAGE_SIZE = 8`, `LIMIT/OFFSET` en SQL.
- Filtro `type` mapea a `WHERE title ILIKE ...` — por diseño (categorías como "Villa", "House" viven en `title`).

### Escritura (Server Actions)

```
PropertyForm.tsx (Client Component)
  → Server Action (app/admin/properties/actions.ts)
  → lib/db/client.ts (getDb)
  → postgres-js: INSERT INTO properties ... / UPDATE properties ...
```

### Internacionalización

```
middleware.ts / layout.tsx
  → lee cookie NEXT_LOCALE (default: 'es')
  → lib/i18n.ts → carga diccionario de data/dictionaries/{locale}.json
  → Dictionary → traduce UI
```

## Convenciones Clave

1. **Mapas solo cliente**: `PropertyMap.tsx` importado con `next/dynamic(ssr: false)`. SSR crashea Leaflet.
2. **Property duplicado**: `data/mockData.ts` define su propia interfaz `Property`. Si se modifica `types/property.ts`, actualizar también `mockData.ts`.
3. **Paginación server-side**: Home usa `.range()` de Supabase. No hay slicing en cliente.
4. **Filtro type ↔ title**: El parámetro `type` filtra por `title` (no columna `type`). Las categorías ("Villa", "House") viven en `title`.
5. **Tailwind v4 tokens**: No usar hex arbitrarios en JSX — usar tokens semánticos.
6. **SF Pro Display** es la fuente del design spec (`antigravity/guidelines.md`), pero el codebase usa Inter.
7. **No instalar librerías sin consultar** (`antigravity/guidelines.md`). Excepción: Zod fue añadido en feature #3 para validación de formularios auth.
8. **Tests con Vitest**: `pnpm test` ejecuta la suite. Ver `vitest.config.ts` para runner y entorno.

## Estado de Capas y Roadmap

| Capa | Estado |
|------|--------|
| Dominio (`types/`) | ✅ Definido — entidades y tipos puros |
| Casos de Uso | 🔲 Lógica dispersa en componentes — pendiente de extracción |
| Adaptadores (`lib/`) | ✅ better-auth + Neon (postgres-js) + i18n + Zod validation |
| Externa (`app/`, `components/`) | ✅ Funcional completa |

La migración planificada extraerá la lógica de negocio de Server/Client Components hacia casos de uso puros en una nueva carpeta (ej. `use-cases/` o `domain/use-cases/`), manteniendo los componentes como capa de presentación únicamente.

## Referencias Externas

- `antigravity/guidelines.md` — paleta de colores, tipografía, reglas de reuso de componentes
- `antigravity/best-practices.md` — SEO, performance, convenciones de data fetching (Next.js real estate)
- `antigravity/resources/` — screenshots UI de referencia (home, detalle de propiedad, filtros, admin dashboard, login, formulario add/edit)