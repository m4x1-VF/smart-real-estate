# auth-hardening — Tasks

> Checklist ejecutable. Cada task referencia al menos un R<n>.
> El implementer marca `[x]` al completar. El reviewer rechaza si queda `[ ]` sin justificación.

---

## Setup

- [x] T1 — Instalar dependencias: `@upstash/ratelimit`, `@upstash/redis`, `@marsidev/react-turnstile`. Añadir a `package.json` via `pnpm add`. Cubre: R1, R2, R8, R9.
- [x] T2 — Añadir variables de entorno `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` a `.env.template` (sin valores). Cubre: R15.

## Rate Limiting

- [x] T3 — Crear `lib/rate-limit.ts` con `loginRateLimit` (slidingWindow 5/60s) y `signupRateLimit` (slidingWindow 3/1h) usando `@upstash/ratelimit` + `@upstash/redis`. Incluir `import 'server-only'`. Manejar error de conexión Redis (fail-open con log). Cubre: R1, R2.
- [x] T4 — Integrar rate limiting en `middleware.ts`: extraer IP del request (`x-forwarded-for` o `request.ip`), aplicar `loginRateLimit` para POST `/api/auth/sign-in/*` y `signupRateLimit` para POST `/api/auth/sign-up/*`. Retornar HTTP 429 con JSON si se excede el límite. Cubre: R1, R2, R3.

## Password Policy

- [x] T5 — Actualizar `lib/auth/schemas.ts`: extraer constante `passwordComplexity` con regex (min 8, upper, lower, digit, special). Aplicar a `signupSchema.password`. Mantener `loginSchema.password` como `min(1)`. Cubre: R4.
- [x] T6 — Actualizar `lib/auth/profile-schemas.ts`: aplicar la misma `passwordComplexity` a `changePasswordSchema.newPassword`. Importar la constante desde `lib/auth/schemas.ts`. Cubre: R5.

## Email Verification

- [x] T7 — Actualizar `lib/auth/index.ts`: cambiar `requireEmailVerification: true`, añadir `emailVerification: { sendOnSignIn: true, sendVerificationEmail }` con callback que loguea la URL de verificación. Cubre: R6, R7.

## Cloudflare Turnstile

- [x] T8 — Crear `lib/turnstile.ts` con función `verifyTurnstileToken(token: string): Promise<boolean>`. POST a `https://challenges.cloudflare.com/turnstile/v0/siteverify` con `TURNSTILE_SECRET_KEY`. Incluir `import 'server-only'`. Cubre: R10.
- [x] T9 — Integrar verificación de Turnstile en `middleware.ts`: para POST `/api/auth/sign-in/*` y `/api/auth/sign-up/*`, extraer token del header `x-turnstile-token`, llamar `verifyTurnstileToken()`. Si falla o está ausente, retornar HTTP 403 con JSON. Cubre: R10, R11.
- [x] T10 — Integrar widget `<Turnstile>` de `@marsidev/react-turnstile` en `app/login/page.tsx`. Almacenar token en estado. Pasar token como header `x-turnstile-token` via `fetchOptions.headers` en `authClient.signIn.email()`. Cubre: R8.
- [x] T11 — Integrar widget `<Turnstile>` de `@marsidev/react-turnstile` en `app/signup/page.tsx`. Almacenar token en estado. Pasar token como header `x-turnstile-token` via `fetchOptions.headers` en `authClient.signUp.email()`. Cubre: R9.

## Session Management

- [x] T12 — Actualizar `lib/auth/index.ts`: añadir `session: { expiresIn: 604800, updateAge: 900, cookieCache: { enabled: true, maxAge: 300 } }`. Cubre: R12, R13.

## CSP Update

- [x] T13 — Actualizar CSP en `middleware.ts`: añadir `https://challenges.cloudflare.com` a `script-src` y añadir directiva `frame-src 'self' https://challenges.cloudflare.com`. Cubre: R14.

## Tests

- [x] T14 — Crear `tests/unit/auth/rate-limit.test.ts`: test que login rate limiter bloquea tras 5 intentos en 60s, signup rate limiter bloquea tras 3 intentos en 1h. Mockear `@upstash/redis`. Cubre: R1, R2, R3.
- [x] T15 — Crear `tests/unit/auth/password-policy.test.ts`: test que `signupSchema` acepta password válida (cumple todas las reglas), rechaza sin mayúscula, sin minúscula, sin dígito, sin especial, con menos de 8 chars. Mismo set para `changePasswordSchema`. Cubre: R4, R5.
- [x] T16 — Crear `tests/unit/auth/turnstile.test.ts`: test que `verifyTurnstileToken` retorna `true` para token válido, `false` para inválido, `false` para error de red. Mockear `fetch`. Cubre: R10, R11.
- [x] T17 — Crear `tests/unit/auth/session-config.test.ts`: test que la configuración de better-auth tiene `session.expiresIn = 604800`, `session.updateAge = 900`, `session.cookieCache.enabled = true`. Cubre: R12, R13.
- [x] T18 — Actualizar tests existentes de `signupSchema` en `tests/unit/auth/schemas.test.ts` para usar passwords que cumplan la nueva política de complejidad. Cubre: R4.

## Verification

- [x] T19 — Ejecutar `pnpm build` y verificar que completa sin errores. Cubre: R1–R15.
- [x] T20 — Ejecutar `pnpm test:run` y verificar que todos los tests pasan al 100%. Cubre: R1–R15.
- [x] T21 — Actualizar `docs/architecture.md`: documentar rate limiting (sección middleware), password policy (sección auth), Turnstile (sección auth), session management (sección auth). Cubre: R1–R15.
- [x] T22 — Crear `progress/impl_auth-hardening.md` con mapa de trazabilidad R<n> → test. Cubre: R1–R15.
