# auth-hardening — Implementation Report

> Feature #11: Hardening de autenticación
> Spec: `specs/auth-hardening/`
> Status: Implemented (awaiting review)

---

## Summary

Implemented rate limiting (Upstash Redis), password complexity (Zod regex), email verification (better-auth), Cloudflare Turnstile bot protection, session management (7d/15min/5min cache), and CSP update for Turnstile domains.

## Files Created

| File | Description |
|------|-------------|
| `lib/rate-limit.ts` | `loginRateLimit` (5/min) and `signupRateLimit` (3/h) using Upstash |
| `lib/turnstile.ts` | `verifyTurnstileToken()` — POST to Cloudflare siteverify API |
| `tests/unit/auth/rate-limit.test.ts` | 6 tests — rate limiter blocking behavior |
| `tests/unit/auth/password-policy.test.ts` | 12 tests — signup + changePassword complexity rules |
| `tests/unit/auth/turnstile.test.ts` | 5 tests — token verification (valid/invalid/error/missing-secret) |
| `tests/unit/auth/session-config.test.ts` | 5 tests — expiresIn, updateAge, cookieCache, requireEmailVerification |

## Files Modified

| File | Change |
|------|--------|
| `middleware.ts` | Added rate limiting + Turnstile verification for auth endpoints; CSP updated with Turnstile domains |
| `lib/auth/schemas.ts` | Added `passwordComplexity` constant; applied to `signupSchema.password` |
| `lib/auth/profile-schemas.ts` | Applied `passwordComplexity` to `changePasswordSchema.newPassword` |
| `lib/auth/index.ts` | Added session config (7d/15min/5min), email verification (requireEmailVerification + sendOnSignIn) |
| `app/login/page.tsx` | Integrated `<Turnstile>` widget; sends token as `x-turnstile-token` header |
| `app/signup/page.tsx` | Integrated `<Turnstile>` widget; sends token as `x-turnstile-token` header |
| `.env.template` | Added UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY |
| `docs/architecture.md` | Documented rate limiting, Turnstile, password policy, session management |
| `tests/unit/auth/schemas.test.ts` | Updated passwords to meet new complexity rules |
| `tests/unit/auth/middleware.test.ts` | Added mocks for rate-limit/turnstile; added CSP Turnstile tests |
| `tests/security-headers.test.ts` | Added mocks for new middleware dependencies |
| `tests/unit/profile-actions.test.ts` | Updated passwords to meet new complexity rules |
| `tests/unit/profile-form.test.tsx` | Updated passwords to meet new complexity rules |

---

## Traceability: R\<n\> → Test

| Requirement | Implementation | Test(s) |
|-------------|---------------|---------|
| R1 — Rate limit login: 5/min/IP | `lib/rate-limit.ts` + `middleware.ts` | `tests/unit/auth/rate-limit.test.ts` — loginRateLimit allows/blocks |
| R2 — Rate limit signup: 3/h/IP | `lib/rate-limit.ts` + `middleware.ts` | `tests/unit/auth/rate-limit.test.ts` — signupRateLimit allows/blocks |
| R3 — HTTP 429 on rate limit exceeded | `middleware.ts` — returns 429 + JSON | `tests/unit/auth/rate-limit.test.ts` — blocking behavior |
| R4 — Password complexity in signupSchema | `lib/auth/schemas.ts` — `passwordComplexity` | `tests/unit/auth/password-policy.test.ts` — signupSchema tests |
| R5 — Password complexity in changePasswordSchema | `lib/auth/profile-schemas.ts` — imports `passwordComplexity` | `tests/unit/auth/password-policy.test.ts` — changePasswordSchema tests |
| R6 — requireEmailVerification: true | `lib/auth/index.ts` — emailAndPassword config | `tests/unit/auth/session-config.test.ts` — requireEmailVerification |
| R7 — Reject login without verified email | better-auth native behavior + sendOnSignIn | `lib/auth/index.ts` — emailVerification.sendOnSignIn |
| R8 — Turnstile widget on /login | `app/login/page.tsx` — `<Turnstile>` component | Build + integration (widget renders when site key set) |
| R9 — Turnstile widget on /signup | `app/signup/page.tsx` — `<Turnstile>` component | Build + integration (widget renders when site key set) |
| R10 — Server-side Turnstile verification | `lib/turnstile.ts` + `middleware.ts` | `tests/unit/auth/turnstile.test.ts` — valid token |
| R11 — Reject invalid/absent Turnstile token | `middleware.ts` — returns 403 + JSON | `tests/unit/auth/turnstile.test.ts` — invalid/error/absent |
| R12 — session.expiresIn = 604800 (7d) | `lib/auth/index.ts` — session config | `tests/unit/auth/session-config.test.ts` — expiresIn |
| R13 — session.updateAge = 900 (15min) | `lib/auth/index.ts` — session config | `tests/unit/auth/session-config.test.ts` — updateAge |
| R14 — CSP includes challenges.cloudflare.com | `middleware.ts` — script-src + frame-src | `tests/unit/auth/middleware.test.ts` — CSP Turnstile tests; `tests/security-headers.test.ts` |
| R15 — Env vars in .env.template | `.env.template` | Manual verification (4 vars added without values) |

---

## Verification Results

- **pnpm build**: ✅ Passes
- **pnpm test:run**: ✅ 171/171 tests pass (29 test files)
