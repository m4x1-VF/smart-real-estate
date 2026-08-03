# Implementation Report — security-headers

## Status: DONE (pending reviewer)

## Files Modified

| File | Action | What changed |
|------|--------|--------------|
| `next.config.ts` | Modified | Added `headers()` with 5 static security headers + Cache-Control for `/admin/:path*` |
| `middleware.ts` | Modified | Added CSP nonce generation (Web Crypto API) and `Content-Security-Policy` header |
| `tests/security-headers.test.ts` | Created | 5 tests covering R1–R8 |
| `specs/security-headers/tasks.md` | Modified | Marked T1–T8 as `[x]` |

## Design Decision: Web Crypto API

**Original spec** called for `crypto.randomBytes(16)` (Node.js `crypto` module). This triggered an Edge Runtime warning during `pnpm build` because middleware runs in Edge Runtime, not Node.js.

**Fix:** Used `crypto.getRandomValues(new Uint8Array(16))` + `btoa()` — Web Crypto API supported in Edge Runtime. Same 16-byte random nonce, same base64 output, no warning.

## Traceability — Requirements → Tests

| Requirement | Description | Test(s) |
|-------------|-------------|---------|
| R1 | Static security headers via `headers()` in `next.config.ts` | `next.config.ts — static security headers > returns headers() with all required security headers for catch-all route` |
| R3 | `Strict-Transport-Security` with correct max-age | `sets HSTS with max-age >= 63072000, includeSubDomains, and preload` |
| R4 | `X-Frame-Options: DENY` | Covered by first test (headerMap check) |
| R5 | `X-Content-Type-Options: nosniff` | Covered by first test (headerMap check) |
| R6 | `Referrer-Policy: strict-origin-when-cross-origin` | Covered by first test (headerMap check) |
| R7 | `Permissions-Policy: camera=(), microphone=(), geolocation=()` | Covered by first test (headerMap check) |
| R2 | CSP nonce per request in middleware | `middleware — CSP nonce > sets Content-Security-Policy header with nonce` + `generates different nonces for different requests` |
| R8 | `Cache-Control: no-store, private` for `/admin/*` | `next.config.ts — Cache-Control for admin routes > sets Cache-Control: no-store, private for /admin/:path*` |
| R9 | `pnpm build` passes | ✅ Verified (T7) |
| R10 | `pnpm test:run` passes 100% | ✅ 139/139 tests pass (T8) |

## Verification Results

- **pnpm build:** ✅ Compiled successfully, no errors, no crypto warnings
- **pnpm test:run:** ✅ 25 files, 139 tests, all green
