---
name: luxu-estate-ui
description: >
  Luxu Estate UI-specific patterns. For generic patterns, see: typescript, react-19, nextjs-16, tailwind-4, vitest.
  Trigger: When creating/modifying/reviewing components, pages, or server actions
  on Luxu Estate, or when deciding where a new piece of code belongs.
license: Apache-2.0
metadata:
  author: luxu-estate
  version: "2.0"
  scope: [root]
  auto_invoke:
    - "Creating/modifying Luxu Estate UI components or pages"
    - "Reviewing Luxu Estate UI components or pages"
    - "Deciding where new code belongs (component, lib, types, tests)"
    - "Working on form patterns, server actions, or Supabase data fetching"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## Related Generic Skills

- `typescript` - Const types, flat interfaces
- `react-19` - Server Components, async components, no `useMemo`/`useCallback` (compiler)
- `nextjs-16` - App Router, Server Actions, `searchParams` as `Promise<...>`
- `tailwind-4` - `@tailwindcss/postcss`, utility-first, no `cn()` helper installed
- `vitest` - Unit + integration tests in `tests/`
- `zod-4` - Schema validation (only if a feature introduces it; not used yet)

## Tech Stack (Actual)

```text
Next.js 16.1.6 | React 19.2.3 | TypeScript 5
Tailwind 4 (via @tailwindcss/postcss)
Supabase (@supabase/ssr ^0.8, @supabase/supabase-js ^2.97)
Leaflet + react-leaflet (maps)
Lucide React (icons)
Vitest 2 + @vitest/coverage-v8
pnpm
```

> Luxu Estate does **NOT** use shadcn/ui, React Hook Form, NextAuth, Recharts,
> Zustand, MSW, or Playwright. Do not introduce any of these without an
> approved spec that justifies the dependency weight.

## Project Structure (Actual)

```text
.
├── app/                       # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home
│   ├── globals.css            # Tailwind entry
│   ├── login/                 # Public auth pages
│   ├── auth/callback/         # Supabase auth callback (route.ts)
│   ├── properties/[slug]/     # Public property detail
│   └── admin/                 # Admin area (gated by middleware)
│       ├── layout.tsx
│       ├── page.tsx
│       ├── properties/        # CRUD pages
│       └── users/             # page.tsx + actions.ts (Server Action)
├── components/
│   ├── *.tsx                  # Presentational, app-level components
│   ├── ui/                    # Reusable presentational primitives
│   └── admin/                 # Admin-specific composed components
├── lib/
│   ├── i18n.ts                # Dictionary loader
│   └── supabase/
│       ├── server.ts          # createClient() async, for RSC/Actions
│       ├── client.ts          # createClient() sync, for Client Components
│       └── middleware.ts      # updateSession() for middleware.ts
├── types/                     # Domain layer (pure TS, no runtime imports)
│   ├── property.ts            # Property entity
│   ├── supabase.ts            # Database schema
│   └── i18n.ts                # Dictionary shape
├── data/
│   ├── mockData.ts            # Static fallback data
│   └── dictionaries/{en,es,fr}.json
├── tests/                     # Vitest, NOT co-located
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                      # Project documentation
├── progress/                  # Session lifecycle
├── specs/<feature>/           # SDD artifacts (requirements, design, tasks)
├── middleware.ts              # Supabase session refresh + admin guard
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## CRITICAL: No Component Library

- **DO NOT** add shadcn/ui, HeroUI, Radix primitives, MUI, Chakra, etc.
- Tailwind v4 utility classes only, applied directly in JSX.
- If a reusable visual primitive is needed, build it in `components/ui/`
  with plain Tailwind. Do not wrap it in a library-specific API.

## Clean Architecture (Quick Reminder)

```
[ Dominio ]    types/          pure TS, no React/Next/Supabase imports
     ↓
[ Adaptadores ] lib/, data/    Supabase clients, i18n loader, mock data
     ↓
[ Externa ]    app/, components/   Next.js, React, Leaflet
```

- Domain types in `types/` are the source of truth. `data/mockData.ts` and
  Supabase responses must conform to them.
- Components MUST NOT import directly from `lib/supabase/...` to talk to
  the database; that goes through a Server Component or Server Action.

## Supabase Client (By Context)

| Context                              | Client                                       |
|--------------------------------------|----------------------------------------------|
| Server Component, RSC                | `await createClient()` from `@/lib/supabase/server` |
| Server Action (`'use server'`)       | same as above                                |
| Client Component (`'use client'`)    | `createClient()` from `@/lib/supabase/client` (sync) |
| Middleware                           | `updateSession()` from `@/lib/supabase/middleware` |

```typescript
// ✅ Server Component
const supabase = await createClient();
const { data: properties } = await supabase.from('properties').select('*');

// ✅ Client Component
const supabase = createClient();
```

## Code Placement Decision Tree

```text
Pure type/interface (used 2+ places)  → types/{domain}.ts
Pure type/interface (used 1 place)     → co-locate in {module}/types.ts
Supabase client (server)              → lib/supabase/server.ts
Supabase client (client)              → lib/supabase/client.ts
Supabase client (middleware)          → lib/supabase/middleware.ts
Dictionary / i18n loader              → lib/i18n.ts
Static data fallback                  → data/mockData.ts
Translations                          → data/dictionaries/{locale}.json
Server action                         → co-located in route folder, e.g. app/admin/users/actions.ts
App page                              → app/{route}/page.tsx
App layout                            → app/{route}/layout.tsx
Route handler                         → app/{route}/route.ts
Shared UI primitive (used 2+ places)  → components/ui/
Domain composed component             → components/admin/  (or components/{domain}/ if more domains exist)
App-level presentational              → components/{PascalCase}.tsx
Tests                                 → tests/{unit|integration|e2e}/{topic}.test.ts
```

> **Scope rule (absolute):** used 2+ places → shared folder. Used 1 place
> → keep local. This is the only folder-structure rule that matters.

## React Server Components vs Client Components

```typescript
// ✅ Server Component (default) — async, no directive
export default async function Home({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const { data } = await supabase.from('properties').select('*');
  return <PropertyList items={data ?? []} />;
}

// ✅ Client Component — 'use client' as FIRST line, before any import
'use client';
import { useState } from 'react';
export default function PropertyForm({ initialData }: PropertyFormProps) { ... }

// ✅ Server Action — 'use server' as FIRST line, file dedicated to actions
'use server';
import { createClient } from '@/lib/supabase/server';
export async function toggleUserRole(userId: string, currentRole: string) { ... }
```

- Add `'use client'` only when the component actually needs interactivity
  (`useState`, `useEffect`, event handlers, browser APIs).
- A Server Component that needs a small interactive piece should keep
  itself as a Server Component and import a Client Component child
  rather than downgrade the whole tree.

## Component Conventions

- One component per file. File name = component name (PascalCase).
- Default export at the bottom of the file.
- Props typed with a local `<ComponentName>Props` interface above the
  component, destructured in the signature.
- Tailwind classes inline in JSX. No `cn()` helper — use template
  literals or `clsx` only if a feature justifies it in its spec.
- No co-located tests, styles, or stories. Tests go in `tests/`.

```typescript
// ✅
interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-lg font-semibold">{property.title}</h3>
    </article>
  );
};

export default PropertyCard;
```

## Styling Conventions

- Tailwind v4 utilities, no inline `style` except for truly dynamic values
  (e.g., map coordinates, custom chart props).
- Color palette comes from `app/globals.css` and Tailwind defaults. Do not
  introduce raw hex values; if a new token is needed, add it to the CSS
  theme layer first.
- Reuse existing components: `Pagination`, `PropertyCard`, `PropertyMap`,
  `FeaturedCollection`, `NewInMarket`, `FilterModal`, `Navbar`,
  `LanguageSelector`, `LogoutButton`, `PropertyGallery`.
- Maps: `PropertyMap` is the presentational component,
  `DynamicPropertyMap` is the lazy-loaded wrapper. Use the latter in
  pages that import maps at the top level.

## Form + Validation Pattern (No RHF, No Zod Yet)

The project does not use React Hook Form or Zod yet. The current
convention is a controlled-state form with a `useState<Partial<Entity>>`
and a `handleSubmit` that does `try/catch/finally` (see
`docs/conventions.md` for the full pattern). If a new feature needs
schema validation, propose Zod in the spec first — do not add the
dependency ad hoc.

## Server Action Pattern (Auth + Authz + Error)

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function doSomething(payload: SomeInput) {
  const supabase = await createClient();

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 2. Authz (admin check via user_roles + is_admin())
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!roleData || roleData.role !== 'admin') {
    throw new Error('Not authorized');
  }

  // 3. Operation — re-throw Supabase errors
  const { error } = await supabase.from('...').update(payload);
  if (error) {
    console.error('Error updating ...:', error);
    throw new Error('Failed to update ...');
  }

  revalidatePath('/admin/...');
}
```

- Always: auth → authz → operation → revalidate.
- Never trust the client: re-validate in the action.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

## i18n Conventions

- Translations live in `data/dictionaries/{en,es,fr}.json`. Shape is
  defined by `Dictionary` in `types/i18n.ts`.
- `lib/i18n.ts` loads the dictionary by locale; pages call
  `getDictionary(locale)` (or equivalent) to get a typed `Dictionary`.
- Adding a key requires updating the type in `types/i18n.ts` AND all
  three locale files in the same commit. The reviewer will reject
  partial translations.

## Anti-Patterns (Do Not)

- ❌ `'use client'` on a component that has no interactivity.
- ❌ Importing Supabase client directly into a Client Component tree
  above the boundary — move the data fetch to a Server Component or
  Server Action.
- ❌ Mocking the filesystem in tests. Use `os.tmpdir()` + `fs.mkdtempSync()`.
- ❌ `console.log` left in code. `console.error` is allowed in catch
  blocks and Server Actions for debugging.
- ❌ Raw hex colors or one-off `style={{ color: '...' }}`. Use Tailwind
  utilities or a token.
- ❌ Co-located tests, styles, or stories. Tests go to `tests/`.
- ❌ Default export in `lib/` or `types/`. Named exports only.
- ❌ TODO without context. If you must leave one, link the issue or the
  spec section it blocks.

## Commands (Real Ones Only)

```bash
# Development
pnpm dev                # next dev on :3000

# Build / start
pnpm build
pnpm start

# Quality
pnpm lint               # ESLint (flat config, eslint-config-next)
npx tsc --noEmit        # typecheck (no script — run manually)

# Tests
pnpm test               # Vitest watch
pnpm test:run           # Vitest single run
pnpm test:coverage      # Vitest + coverage
```

> There is **no** `typecheck`, `lint:fix`, `format:write`, `healthcheck`,
> or `test:e2e` script. Do not invent one. If you need a pre-commit
> hook, add it to the spec first.

## QA Checklist Before Commit

- [ ] `pnpm lint` passes
- [ ] `npx tsc --noEmit` passes (run manually)
- [ ] `pnpm test:run` passes (and new code has tests if `sdd: true`)
- [ ] No `console.log` left in code
- [ ] No new TODO without context
- [ ] No secrets in code (use `.env.local`)
- [ ] Server Actions re-validate auth and authz
- [ ] Error states handled in forms (loading, error banner, disabled submit)
- [ ] Accessibility: keyboard navigation, labels on inputs, `aria-*` where needed
- [ ] Mobile responsive where the surface allows it
- [ ] i18n: any new user-facing string is added to all three dictionaries
      AND to `types/i18n.ts`
