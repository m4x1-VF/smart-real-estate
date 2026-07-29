# user-profile — Requirements

> Feature #6 — Perfil de usuario: avatar, nombre y contraseña.
> Formato: EARS estricto (ver `docs/specs.md`).

## R1

CUANDO un usuario no autenticado navega a `/profile`, el sistema DEBE
redirigirlo a `/login`.

## R2

CUANDO un usuario autenticado accede a `/profile`, el sistema DEBE mostrar
su nombre actual y su email actual en el formulario de perfil.

## R3

CUANDO el usuario edita su nombre y envía el formulario de actualización de
perfil, el sistema DEBE persistir el nuevo nombre en la tabla `user` de
better-auth y mostrar confirmación de éxito.

## R4

SI el nombre enviado está vacío ENTONCES el sistema DEBE rechazar la
actualización y mostrar un mensaje de error de validación sin invocar la
server action.

## R5

CUANDO el usuario selecciona una imagen de avatar en el formulario de perfil,
el sistema DEBE subirla a Cloudinary mediante la server action
`uploadAvatar` y actualizar el campo `image` del usuario autenticado.

## R6

La server action `uploadAvatar` DEBE verificar que el usuario tiene una
sesión activa antes de procesar el upload.

## R7

SI el archivo de avatar seleccionado no es una imagen válida (tipo MIME no es
`image/jpeg`, `image/png`, `image/webp` o `image/gif`) ENTONCES el sistema
DEBE rechazar el archivo y mostrar un mensaje de error descriptivo sin invocar
la server action.

## R8

SI el archivo de avatar seleccionado excede 2 MB ENTONCES el sistema DEBE
rechazar el archivo y mostrar un mensaje de error descriptivo sin invocar
la server action.

## R9

CUANDO el usuario selecciona una imagen de avatar, el sistema DEBE optimizarla
en cliente usando `optimizeImage()` antes de enviarla a la server action
`uploadAvatar`.

## R10

CUANDO el avatar se actualiza exitosamente, el sistema DEBE mostrar la nueva
imagen de avatar tanto en `/profile` como en el Navbar (el Navbar ya consume
`user.image` vía `auth.api.getSession()`).

## R11

CUANDO el usuario envía el formulario de cambio de contraseña, el sistema
DEBE verificar que la contraseña actual es correcta antes de aplicar el
cambio.

## R12

SI la contraseña actual ingresada es incorrecta ENTONCES el sistema DEBE
rechazar el cambio y mostrar un mensaje de error indicando que la contraseña
actual no es válida.

## R13

La nueva contraseña DEBE tener al menos 8 caracteres. SI la nueva contraseña
tiene menos de 8 caracteres ENTONCES el sistema DEBE rechazar el cambio y
mostrar un mensaje de error de validación.

## R14

SI la confirmación de nueva contraseña no coincide con la nueva contraseña
ENTONCES el sistema DEBE rechazar el cambio y mostrar un mensaje de error
de validación.

## R15

SI la subida del avatar a Cloudinary falla (error de red, credenciales
inválidas, respuesta no-2xx) ENTONCES el sistema DEBE mostrar un mensaje de
error visible en el formulario y NO DEBE actualizar el campo `image` del
usuario.

## R16

El sistema DEBE incluir tests L2 (server actions: `updateProfile`,
`changePassword`, `uploadAvatar`) que verifiquen: (a) actualización de nombre
exitosa, (b) nombre vacío rechazado, (c) cambio de contraseña exitoso,
(d) contraseña actual incorrecta rechazada, (e) nueva contraseña corta
rechazada, (f) upload de avatar exitoso, (g) MIME inválido rechazado,
(h) tamaño excesivo rechazado, (i) sesión no autenticada rechazada.

## R17

El sistema DEBE incluir tests L3 (componente `ProfileForm`) que verifiquen:
(a) renderizado de datos del usuario, (b) envío de actualización de nombre,
(c) envío de cambio de contraseña, (d) selección y upload de avatar.

## R18

El sistema DEBE documentar la trazabilidad R↔test en
`progress/impl_user-profile.md`.
