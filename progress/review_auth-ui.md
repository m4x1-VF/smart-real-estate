# Review — feature #3 `auth-ui`

**Veredicto:** APPROVED

## Trazabilidad requirements ↔ tests

| R<n> | Test / evidencia | Estado |
|------|-----------------|:------:|
| R1 | `tests/unit/auth/social-providers.test.ts` — "returns config with Google and GitHub when all env vars are present" (L11-25) verifica `result.google.clientId === 'google-id'` | [x] |
| R2 | `tests/unit/auth/social-providers.test.ts` — mismo test verifica `result.github.clientId === 'github-id'` (L22-24) | [x] |
| R3 | `app/login/page.tsx` L81-105 — form con inputs email (L82-89), password (L90-97), submit "Sign in" (L98-104) | [x] |
| R4 | `app/login/page.tsx` L29-33 — `authClient.signIn.emailAndPassword({ email, password, callbackURL: '/' })` | [x] |
| R5 | `app/login/page.tsx` L41 — `router.push('/')` tras éxito | [x] |
| R6 | `app/login/page.tsx` L21-25 (Zod validation → primer mensaje) + L35-38 (server error → "Invalid email or password") + banner L75-79 | [x] |
| R7 | `app/login/page.tsx` L117-157 — botones Google (L117-143) y GitHub (L145-157) con `handleSocialLogin` | [x] |
| R8 | `app/login/page.tsx` L44-55 — `handleSocialLogin` setea error `"Could not connect with ${provider}. Please try again."` | [x] |
| R9 | `app/signup/page.tsx` existe (206 líneas), default export `SignupPage` | [x] |
| R10 | `app/signup/page.tsx` L84-116 — form con name (L85-92), email (L93-100), password (L101-108), confirmPassword (L109-116) | [x] |
| R11 | `tests/unit/auth/schemas.test.ts` — "rejects non-matching passwords" (L77-89), "rejects password shorter than 8 characters" (L63-75), "rejects empty name" (L91-103), "rejects invalid email" (L49-61) | [x] |
| R12 | `app/signup/page.tsx` L31-36 — `authClient.signUp.emailAndPassword({ name, email, password, callbackURL: '/' })` | [x] |
| R13 | `app/signup/page.tsx` L44 — `router.push('/')` tras éxito | [x] |
| R14 | `app/signup/page.tsx` L38-42 — error → `"An account with this email already exists"` + banner L78-82 | [x] |
| R15 | `app/signup/page.tsx` L135-177 — botones Google (L136-162) y GitHub (L164-176) con `handleSocialLogin` | [x] |
| R16 | `tests/unit/auth/middleware.test.ts` L76-84 — "redirects /signup to / when a valid session cookie exists"; `middleware.ts` L9 incluye `/signup` en `isAuthRoute` | [x] |
| R17 | `tests/unit/auth/middleware.test.ts` L46-54 — "redirects /login to / when a valid session cookie exists" (pre-existing, still passes) | [x] |

**Resultado: 17/17 requirements cubiertos.**

## Tasks completas

| Task | Estado | Notas |
|------|:------:|-------|
| T1 | [x] | `lib/auth/social-providers.ts` — función pura, 27 líneas |
| T2 | [x] | `lib/auth/index.ts` L6, L16, L18 — importa `buildSocialProviders`, `requireEmailVerification: false`, `socialProviders: buildSocialProviders()` |
| T3 | [x] | `tests/unit/auth/social-providers.test.ts` — 4 tests (all present, omit Google, omit GitHub, empty) |
| T4 | [x] | `zod` en `package.json` dependencies |
| T5 | [x] | `lib/auth/schemas.ts` — `loginSchema`, `signupSchema` con refine, tipos exportados |
| T6 | [x] | `tests/unit/auth/schemas.test.ts` — 8 tests (3 login + 5 signup) |
| T7 | [x] | `middleware.ts` L9 — `pathname.startsWith('/signup')` reemplaza `/register` |
| T8 | [x] | `tests/unit/auth/middleware.test.ts` L76-94 — 2 tests nuevos para `/signup` |
| T9 | [x] | `app/login/page.tsx` L17-42 — formulario email/password con Zod validation |
| T10 | [x] | `app/login/page.tsx` L44-55 — `handleSocialLogin` con error handling |
| T11 | [x] | `app/signup/page.tsx` — Client Component con form, social buttons, link a `/login` |
| T12 | [x] | `app/signup/page.tsx` L19-45 — submit con Zod validation + `authClient.signUp.emailAndPassword` |
| T13 | [x] | `.env.template` L11-16 — 4 vars OAuth con comentarios |
| T14 | [x] | `docs/architecture.md` actualizado: routing tree (L265), auth flow (L326-341), adaptadores (L227-228), middleware (L305) |
| T15 | [x] | `pnpm test:run` → 39/39 passed; `pnpm lint` → 0 errors |

**Resultado: 15/15 tasks completadas.**

## Checkpoints

| Checkpoint | Estado | Notas |
|-----------|:------:|-------|
| C1 — Arnés completo | [x] | `AGENTS.md` ✅, `feature_list.json` ✅, `progress/current.md` ✅, `docs/architecture.md` ✅, `docs/conventions.md` ✅, `docs/verification.md` ✅. Nota: `init.sh` no existe — decisión documentada en feature #1 (`progress/history.md` L40: "NO se crea `init.sh`"). Verificación sustituta: `pnpm test:run` + `pnpm lint` ambos verdes. |
| C2 — Estado coherente | [x] | Una sola feature `in_progress` (#3 auth-ui). Features #1 y #2 `done` con tests verdes. `progress/current.md` describe sesión activa. |
| C3 — Código respeta arquitectura | [x] | Nuevos archivos en `lib/auth/` (adaptadores) y `app/signup/` (externa) siguen capas Clean. `zod` documentado en `docs/architecture.md` L12. Sin `console.log` debug (verificado con grep). Sin cambios extrafuera del scope. |
| C4 — Verificación real | [x] | 39 tests en 6 files, todos verdes. Tests para módulos nuevos: `social-providers.test.ts` (4), `schemas.test.ts` (8), `middleware.test.ts` (7, incluye 2 nuevos para `/signup`). |
| C5 — Sesión cerrada bien | [x] | `progress/history.md` tiene entradas para features #1 y #2. Feature #3 en `in_progress` (correcto para fase de review). Sin archivos temporales ni TODOs huérfanos. |
| C6 — SDD | [x] | `specs/auth-ui/` tiene los 3 archivos. `requirements.md` usa EARS estricto (DEBE, CUANDO, SI...ENTONCES). Todas las tasks `[x]`. Cada R<n> cubierto por al menos un test o verificación manual documentada en `progress/impl_auth-ui.md`. |

## Code quality vs design.md

| Aspecto | Verificación |
|---------|-------------|
| Zod schemas match §4 | `loginSchema` y `signupSchema` en `lib/auth/schemas.ts` son idénticos a las firmas del design.md §4 (mensajes, tipos, refine con path `['confirmPassword']`) |
| `buildSocialProviders()` es pura | `lib/auth/social-providers.ts` — solo lee `process.env`, sin DB, sin side effects. Retorno tipo `SocialProvidersConfig`. |
| Error handling sigue §5 | Login: Zod → primer mensaje, authClient → "Invalid email or password", social → "Could not connect with {provider}". Signup: Zod → primer mensaje, authClient → "An account with this email already exists", social → mismo patrón. Banner: `bg-red-50 text-red-600 p-4 rounded-xl border border-red-100` — idéntico al §5. |
| `lib/auth/index.ts` actualizado | L6: importa `buildSocialProviders`. L16: `requireEmailVerification: false`. L18: `socialProviders: buildSocialProviders()`. |
| Middleware actualizado | `middleware.ts` L9: `pathname.startsWith('/signup')` — reemplaza `/register`. |
| `.env.template` actualizado | L11-16: 4 vars OAuth con comentarios descriptivos. |
| `docs/architecture.md` actualizado | Routing tree incluye `/signup` (L265). Flujo auth incluye email/password + Zod (L326-341). Adaptadores lista social-providers y schemas (L227-228). Middleware menciona `/signup` redirect (L305). |

## Tests y lint

```
pnpm test:run → 6 test files, 39 tests, all passed (2.12s)
pnpm lint     → 0 errors
```

## Notas

- R3-R10, R12-R15 son verificados manualmente (UI). El proyecto no tiene React Testing Library ni Playwright (documentado en `docs/conventions.md` L409-411). La trazabilidad documenta el código exacto que implementa cada requirement.
- `init.sh` no existe — decisión tomada en feature #1 y documentada en `progress/history.md`. No es un bloqueo para esta feature.
