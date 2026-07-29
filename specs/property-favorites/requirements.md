# Requirements — property-favorites

> Feature #7: Propiedades favoritas con toggle de corazón y página de guardados.
> Redactado en **EARS estricto** (ver `docs/specs.md`). Cada `R<n>` es
> verificable por al menos un test concreto (L1/L2/L3 — ver
> `docs/verification.md`).

## R1
El sistema DEBE crear una tabla `favorites` con clave primaria compuesta
`(user_id, property_id)`, donde `user_id` es `text` con FK hacia
`public."user"(id) ON DELETE CASCADE` y `property_id` es `uuid` con FK
hacia `public.properties(id) ON DELETE CASCADE`, y un `UNIQUE` constraint
sobre `(user_id, property_id)`.

> Cubre: acceptance 1. Verificación: L1 (migration aplica sin errores,
> estructura de la tabla verificada).

## R2
CUANDO el sistema ejecuta la server action `toggleFavorite(propertyId)`
con una sesión de usuario autenticado, el sistema DEBE insertar una fila
en `favorites` si la propiedad no estaba marcada, o eliminarla si ya lo
estaba, y DEBE devolver el nuevo estado booleano (`true` si ahora es
favorito, `false` si dejó de serlo).

> Cubre: acceptance 2. Verificación: L2 (server action — toggle añade,
> toggle elimina, idempotencia).

## R3
CUANDO el sistema ejecuta la server action `getFavoritePropertyIds(userId)`
con un `userId` válido, el sistema DEBE retornar un array de strings con
los `property_id` (uuid como string) marcados como favoritos por ese
usuario, sin incluir datos de propiedad — solo los IDs.

> Cubre: acceptance 3. Verificación: L2 (server action — retorna IDs
> correctos, array vacío si el usuario no tiene favoritos).

## R4
CUANDO el sistema ejecuta la server action `listFavoriteProperties(userId)`
con un `userId` válido, el sistema DEBE retornar un array de objetos
`Property` completos correspondientes a las propiedades marcadas como
favoritas por ese usuario, ordenadas por `created_at` descendente.

> Cubre: acceptance 4. Verificación: L2 (server action — retorna
> propiedades completas, excluye inactivas si el alcance público lo
> requiere — ver design.md).

## R5
CUANDO el usuario hace click en el botón del corazón de
`FavoriteButton`, el sistema DEBE alternar el estado visual del icono
inmediatamente (estado optimista) sin esperar la confirmación del
servidor, pintando el nuevo estado antes de que la server action
responda.

> Cubre: acceptance 5. Verificación: L3 (FavoriteButton — click alterna
> icono al instante).

## R6
MIENTRAS una propiedad es favorita del usuario, el sistema DEBE mostrar el
icono de corazón relleno (`favorite`) en `FavoriteButton`; MIENTRAS no lo
es, el sistema DEBE mostrar el icono outline (`favorite_border`).

> Cubre: acceptance 6. Verificación: L3 (FavoriteButton — renderiza
> `favorite` si `isFavorited=true`, `favorite_border` si `false`).

## R7
El sistema DEBE aceptar una prop `isFavorited` (boolean) en
`PropertyCard` y `CollectionCard` y DEBE renderizar `FavoriteButton`
usando ese estado inicial en lugar del botón estático actual.

> Cubre: acceptance 7. Verificación: L3 (PropertyCard/CollectionCard
> pasan `isFavorited` a FavoriteButton y renderizan el componente).

## R8
CUANDO el usuario hace click en el botón del corazón dentro de un
`PropertyCard` o `CollectionCard` (que son `<Link>` al detalle), el
sistema NO DEBE navegar al detalle de la propiedad; el handler del
`FavoriteButton` DEBE invocar `preventDefault()` y `stopPropagation()`
sobre el evento.

> Cubre: acceptance 8. Verificación: L3 (FavoriteButton — click no
> dispara navegación del Link contenedor).

## R9
SI el usuario no está autenticado y hace click en el botón del corazón
ENTONCES el sistema DEBE redirigir al usuario a `/login`.

> Cubre: acceptance 9. Verificación: L3 (FavoriteButton — click sin
> sesión invoca `redirect('/login')` o equivalente client-side).

## R10
EL sistema DEBE proveer una página `/saved` que, para un usuario
autenticado, muestra todas las propiedades marcadas como favoritas por
ese usuario usando `PropertyCard` en un grid.

> Cubre: acceptance 10. Verificación: L2/L3 (página /saved — renderiza
> PropertyCards con las propiedades favoritas del usuario).

## R11
El sistema DEBE actualizar el link `saved_homes` del `Navbar` (desktop
y mobile) para que apunte a `/saved` en lugar de `#`.

> Cubre: acceptance 11. Verificación: L3 (Navbar — ambos links
`href="/saved"`).

## R12
SI no hay sesión de usuario activa y se accede a `/saved` ENTONCES el
sistema DEBE redirigir a `/login`.

> Cubre: acceptance 12. Verificación: L2 (página /saved — redirect a
`/login` si `auth.api.getSession()` retorna null).

## R13
El sistema DEBE validar que `toggleFavorite` rechaza la operación si no
hay sesión autenticada, lanzando un error o retornando un resultado de
fallo sin modificar la base de datos.

> Cubre: derivado de acceptance 2 + 9 (gate de auth en server action).
> Verificación: L2 (toggleFavorite sin sesión — no escribe en DB).

## R14
El sistema DEBE documentar el mapa de trazabilidad `R<n>` ↔ test en
`progress/impl_property-favorites.md` cubriendo L2 (server actions) y L3
(FavoriteButton / componentes), con todos los tests en verde.

> Cubre: acceptance 13, 14. Verificación: L4 (trazabilidad).