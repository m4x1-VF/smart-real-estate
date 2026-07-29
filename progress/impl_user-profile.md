# user-profile — Trazabilidad R↔Test

> Feature #6 — Mapeo de cada requirement a su(s) test(s) correspondiente(s).

## Requisitos → Tests

| Req | Descripción | Test(s) | Archivo |
|-----|-------------|---------|---------|
| R1 | Redirect a /login si no autenticado | Middleware test (existing `tests/unit/auth/middleware.test.ts`); T7 page redirect | `middleware.ts`, `app/profile/page.tsx` |
| R2 | Mostrar nombre y email actuales | L3 test (a): renders user data correctly | `tests/unit/profile-form.test.tsx` |
| R3 | Persistir nuevo nombre | L2 test (a): updates name successfully; L3 test (b): submits profile update | `tests/unit/profile-actions.test.ts`, `tests/unit/profile-form.test.tsx` |
| R4 | Rechazar nombre vacío | L2 test (b): rejects empty name | `tests/unit/profile-actions.test.ts` |
| R5 | Subir avatar a Cloudinary | L2 test (g): uploads avatar successfully | `tests/unit/profile-actions.test.ts` |
| R6 | Verificar sesión en uploadAvatar | L2 test (j): rejects unauthenticated session | `tests/unit/profile-actions.test.ts` |
| R7 | Rechazar MIME inválido | L2 test (h): rejects file with invalid MIME type | `tests/unit/profile-actions.test.ts` |
| R8 | Rechazar tamaño > 2 MB | L2 test (i): rejects file larger than 2MB | `tests/unit/profile-actions.test.ts` |
| R9 | Optimizar imagen client-side | Implementation in ProfileForm (optimizeImage call); covered by L3 tests | `components/ProfileForm.tsx` |
| R10 | Mostrar avatar en /profile y Navbar | L3 test (a): renders user data; Navbar Link implementation | `components/Navbar.tsx`, `components/ProfileForm.tsx` |
| R11 | Verificar contraseña actual | L2 test (e): rejects incorrect current password | `tests/unit/profile-actions.test.ts` |
| R12 | Rechazar contraseña actual incorrecta | L2 test (e): rejects incorrect current password; L3 test (e): shows error banner | `tests/unit/profile-actions.test.ts`, `tests/unit/profile-form.test.tsx` |
| R13 | Nueva contraseña ≥ 8 chars | L2 test (f): rejects new password shorter than 8 characters | `tests/unit/profile-actions.test.ts` |
| R14 | Confirmación debe coincidir | L2 test (f2): rejects mismatched password confirmation | `tests/unit/profile-actions.test.ts` |
| R15 | Error de Cloudinary no actualiza image | L2 test (k): propagates Cloudinary error as friendly message | `tests/unit/profile-actions.test.ts` |
| R16 | Tests L2 de server actions | 12 tests in `tests/unit/profile-actions.test.ts` | `tests/unit/profile-actions.test.ts` |
| R17 | Tests L3 de ProfileForm | 6 tests in `tests/unit/profile-form.test.tsx` | `tests/unit/profile-form.test.tsx` |
| R18 | Trazabilidad documentada | This document | `progress/impl_user-profile.md` |

## Resumen de tests

- **L2 (Server Actions)**: 12 tests — `tests/unit/profile-actions.test.ts`
  - updateProfile: 3 tests (success, empty name, no session)
  - changePassword: 4 tests (success, wrong current, short password, mismatch)
  - uploadAvatar: 5 tests (success, invalid MIME, too large, no session, cloudinary error)
- **L3 (Component)**: 6 tests — `tests/unit/profile-form.test.tsx`
  - Renders user data
  - Submits profile update
  - Submits password change
  - Shows error on profile update failure
  - Shows error on password change failure
  - Shows success message after profile update

## Archivos creados/modificados

### Creados
- `lib/auth/profile-schemas.ts` — Zod schemas for profile updates
- `app/profile/actions.ts` — Server actions (updateProfile, changePassword, uploadAvatar)
- `app/profile/page.tsx` — Profile page (Server Component)
- `components/ProfileForm.tsx` — Profile form (Client Component)
- `tests/unit/profile-actions.test.ts` — L2 tests for server actions
- `tests/unit/profile-form.test.tsx` — L3 tests for ProfileForm component
- `progress/impl_user-profile.md` — This traceability document

### Modificados
- `middleware.ts` — Added /profile to protected routes
- `lib/cloudinary.ts` — Added optional `options` parameter for folder
- `components/Navbar.tsx` — Wrapped avatar in Link to /profile
- `vitest.config.ts` — Added .tsx test file support
- `docs/architecture.md` — Documented /profile page and server actions
