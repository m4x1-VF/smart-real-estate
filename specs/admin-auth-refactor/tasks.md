# admin-auth-refactor — Tasks

## Helper y query eficiente

- [x] T1 — Reemplazar `isAdminUser(email)` por `isAdmin(userId)` en `lib/db/admin.ts`: query `SELECT 1 ... LIMIT 1`, envuelto en React `cache()`. Cubre: R1, R2, R3, R9.

## Refactor del layout

- [x] T2 — Modificar `app/admin/layout.tsx`: reemplazar query inline por `isAdmin(session.user.id)`. Cubre: R8.

## Refactor de server actions

- [x] T3 — Modificar `app/admin/users/actions.ts`: reemplazar query inline en `toggleUserRole` por `isAdmin(session.user.id)`. Cubre: R6.
- [x] T4 — Modificar `app/admin/properties/actions.ts`: reemplazar `verifyAdminSession()` por `requireAdmin()` usando `isAdmin()`. Agregar `requireAdmin()` a `saveProperty` y `togglePropertyActiveAction` (actualmente no verifican admin). Cubre: R6.

## Verificación por página (defense in depth)

- [x] T5 — Agregar verificación admin + Cache-Control header en `app/admin/users/page.tsx`. Cubre: R4, R5, R7.
- [x] T6 — Agregar verificación admin + Cache-Control header en `app/admin/properties/page.tsx`. Cubre: R4, R5, R7.
- [x] T7 — Agregar verificación admin + Cache-Control header en `app/admin/properties/create/page.tsx`. Cubre: R4, R5, R7.
- [x] T8 — Agregar verificación admin + Cache-Control header en `app/admin/properties/[id]/edit/page.tsx`. Cubre: R4, R5, R7.

## Tests

- [x] T9 — Test unitario de `isAdmin(userId)`: retorna `true` para admin, `false` para non-admin, `false` para userId inexistente. Cubre: R1, R2.
- [x] T10 — Test de que `isAdmin()` con React `cache()` deduplica llamadas (mock `getDb` verifica una sola query). Cubre: R3.
- [x] T11 — Tests de server actions: `toggleUserRole`, `saveProperty`, `togglePropertyActiveAction`, `uploadImage` lanzan `Error('Not authorized')` para non-admin. Cubre: R6.
- [x] T12 — Tests de page components: cada admin page retorna 403/forbidden para non-admin (verificar que no renderiza datos sensibles). Cubre: R4, R5.

## Verificación final

- [x] T13 — Ejecutar `pnpm build` y verificar que completa sin errores. Cubre: R10.
- [x] T14 — Ejecutar `pnpm test:run` y verificar 100% verde. Cubre: R11.
