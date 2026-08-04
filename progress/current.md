# Sesión actual

- **Feature en curso:** #12 cookie-and-csrf-fixes ✅ DONE
- **Última sesión:** 2026-08-04

## Bitácora

### Feature #12 cookie-and-csrf-fixes ✅ DONE

1. **Cookie NEXT_LOCALE** — Movida de `document.cookie` (client-side) a server action `setLocaleCookie()` con flags `Secure; SameSite=Lax; Path=/`.
2. **bodySizeLimit** — Reducido de `10mb` a `2mb` en `next.config.ts`.
3. **Tests** — 29 archivos, 173 tests verdes.

### Bugfix: Social auth + rate limiting

- Excluidos endpoints de social auth (`/api/auth/sign-in/social`, `/api/auth/callback/*`) de rate limiting y Turnstile en middleware.
- Rate limiter ahora es `null` cuando Redis no está configurado (en vez de fallar).

## Próximo paso

Feature #13: `admin-auth-refactor` (pending, sdd: true) — Refactor de autorización admin.
