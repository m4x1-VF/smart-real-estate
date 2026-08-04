# admin-auth-refactor — Requirements

> Refactor de autorización admin: queries eficientes y verificación por página.
> Resuelve hallazgos H-05, M-02 y M-03.

---

## R1

CUANDO el sistema necesita verificar si un usuario es admin, el sistema DEBE
ejecutar la query `SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1`
en vez de obtener todos los emails de admin y comparar en memoria.

## R2

El sistema DEBE exponer un helper `isAdmin(userId: string): Promise<boolean>`
en `lib/db/admin.ts` que encapsule la query eficiente de R1.

## R3

El helper `isAdmin()` DEBE estar envuelto en React `cache()` para deduplicar
llamadas dentro del mismo request lifecycle (layout + page no generan doble query).

## R4

CUANDO un server component del árbol `/admin/*` renderiza datos sensibles
(listado de usuarios, listado de propiedades, formulario de creación/edición),
el sistema DEBE verificar el rol admin llamando a `isAdmin(userId)` antes de
obtener o renderizar dichos datos.

## R5

SI un usuario autenticado sin rol admin accede a una página admin ENTONCES
el sistema DEBE retornar una respuesta con status 403 y un mensaje de
"acceso denegado" sin renderizar datos sensibles.

## R6

Toda server action del scope admin (`toggleUserRole`, `saveProperty`,
`togglePropertyActiveAction`, `uploadImage`) DEBE verificar el rol admin
llamando a `isAdmin(userId)` antes de ejecutar la operación.

## R7

El sistema DEBE setear el header `Cache-Control: no-store, private` en cada
respuesta de página admin vía `(await headers()).set()` o equivalente en el
server component, como defensa en profundidad adicional al header estático
de `next.config.ts`.

## R8

El layout `app/admin/layout.tsx` DEBE usar `isAdmin(session.user.id)` en vez
de la query inline `SELECT ALL admin emails`.

## R9

La función `isAdminUser(email)` existente en `lib/db/admin.ts` DEBE ser
reemplazada por `isAdmin(userId)` — el parámetro cambia de email a userId
para evitar el JOIN con la tabla `user`.

## R10

`pnpm build` DEBE completar sin errores tras el refactor.

## R11

`pnpm test:run` DEBE pasar al 100% — incluyendo tests nuevos que verifiquen
que un usuario sin rol admin recibe 403 en cada admin page.
