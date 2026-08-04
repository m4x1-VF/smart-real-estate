# Implementation Report: admin-auth-refactor (#13)

## Summary

Refactored admin authorization to use efficient per-user queries with React `cache()` deduplication, added defense-in-depth page-level admin checks using `forbidden()` for real HTTP 403, and Cache-Control headers on all admin pages set before any admin check.

## Changes Made

### New helper
- **`lib/db/admin.ts`**: Replaced `isAdminUser(email)` with `isAdmin(userId)` — query `SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1`, wrapped in React `cache()`.

### Refactored files
- **`app/admin/layout.tsx`**: Replaced inline query with `isAdmin(session.user.id)`.
- **`app/admin/users/actions.ts`**: Replaced inline query with `isAdmin(session.user.id)`.
- **`app/admin/properties/actions.ts`**: Replaced `verifyAdminSession()` with `requireAdmin()` using `isAdmin()`. Added `requireAdmin()` to `saveProperty` and `togglePropertyActiveAction` (previously missing admin check — security gap fixed).
- **`components/Navbar.tsx`**: Updated to use `isAdmin(user.id)` instead of `isAdminUser(user.email)`.

### Page-level admin verification (defense in depth)
- **`app/admin/users/page.tsx`**: `forbidden()` for non-admin + `Cache-Control: no-store, private` set BEFORE admin check.
- **`app/admin/properties/page.tsx`**: `forbidden()` for non-admin + `Cache-Control: no-store, private` set BEFORE admin check.
- **`app/admin/properties/create/page.tsx`**: `forbidden()` for non-admin + `Cache-Control: no-store, private` set BEFORE admin check.
- **`app/admin/properties/[id]/edit/page.tsx`**: `forbidden()` for non-admin + `Cache-Control: no-store, private` set BEFORE admin check.

### Configuration
- **`next.config.ts`**: Enabled `experimental.authInterrupts: true` to support `forbidden()` from `next/navigation`.

### Forbidden boundary
- **`app/admin/forbidden.tsx`**: Custom 403 forbidden UI boundary for admin routes (renders i18n localized forbidden message).

### Tests (new)
- **`tests/unit/db/admin.test.ts`**: 6 tests — admin returns true, non-admin returns false, non-existent userId returns false, **query structure verification (SELECT 1 + LIMIT 1)**, **isAdminUser is not exported**, **isAdmin is the only export**.
- **`tests/unit/db/admin-cache.test.ts`**: 2 tests — deduplication with same userId, separate calls for different userIds.
- **`tests/integration/admin/actions-auth.test.ts`**: 5 tests — all server actions throw "Not authorized" for non-admin.
- **`tests/integration/admin/pages-forbidden.test.tsx`**: 10 tests — all 4 admin pages call `forbidden()` for non-admin (HTTP 403), Cache-Control set BEFORE admin check on all 4 pages (including create/edit), Cache-Control set even on forbidden path.

### Tests (updated)
- **`tests/integration/admin/layout.test.tsx`**: Updated to mock `isAdmin()` instead of raw SQL.
- **`tests/integration/admin/users.test.tsx`**: Added auth + isAdmin mocks.
- **`tests/integration/admin/properties.test.tsx`**: Added auth + isAdmin mocks.

## Review Fixes Applied

| Issue | Fix |
|-------|-----|
| R1: Test doesn't verify query structure | Added test that captures SQL template string and asserts `SELECT 1`, `LIMIT 1`, `user_roles`, `admin` |
| R5: Pages don't return HTTP 403 | Enabled `authInterrupts`, created `forbidden.tsx` boundary, replaced JSX returns with `forbidden()` calls |
| R7: Cache-Control placement | Moved `headers().set('Cache-Control', ...)` to TOP of each page component, before any admin check |
| R9: No proof isAdminUser was removed | Added 2 tests: one verifies `isAdminUser` is undefined, another verifies `isAdmin` is the only export |
| Missing: Cache-Control tests for create/edit | Added Cache-Control tests for create and edit pages (4 new tests) |

## Verification

- `pnpm test:run`: 196/196 tests pass (33 test files) — up from 189 (7 new tests)
- `pnpm build`: Compiles successfully, `authInterrupts` experiment enabled, all routes generated

## Requirements Traceability (R→test)

| Req | Description | Test(s) |
|-----|-------------|---------|
| R1 | Efficient query `SELECT 1 ... LIMIT 1` | `tests/unit/db/admin.test.ts` (query structure test) |
| R2 | Helper `isAdmin(userId)` in `lib/db/admin.ts` | `tests/unit/db/admin.test.ts` (3 behavior tests) |
| R3 | React `cache()` deduplication | `tests/unit/db/admin-cache.test.ts` (2 tests) |
| R4 | Page-level admin check before rendering data | `tests/integration/admin/pages-forbidden.test.tsx` (4 forbidden tests) |
| R5 | Non-admin gets HTTP 403 | `tests/integration/admin/pages-forbidden.test.tsx` (4 `forbidden()` tests) |
| R6 | Server actions verify admin via `isAdmin()` | `tests/integration/admin/actions-auth.test.ts` (5 tests) |
| R7 | `Cache-Control: no-store, private` on admin pages | `tests/integration/admin/pages-forbidden.test.tsx` (6 Cache-Control tests, all 4 pages) |
| R8 | Layout uses `isAdmin(session.user.id)` | `tests/integration/admin/layout.test.tsx` (5 tests) |
| R9 | `isAdminUser(email)` replaced by `isAdmin(userId)` | `tests/unit/db/admin.test.ts` (2 removal verification tests) |
| R10 | `pnpm build` passes | Verified: exit code 0 |
| R11 | `pnpm test:run` passes 100% | 196/196 tests pass |
