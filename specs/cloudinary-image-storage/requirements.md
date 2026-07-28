# cloudinary-image-storage — Requirements

> Feature #4 — Integrar Cloudinary para storage de imágenes de propiedades.
> Formato: EARS estricto (ver `docs/specs.md`).

## R1

CUANDO el admin selecciona uno o más archivos de imagen en el input de galería
de PropertyForm, el sistema DEBE invocar la server action `uploadImage` por cada
archivo para subirlo a Cloudinary.

## R2

La server action `uploadImage` DEBE autenticarse contra Cloudinary usando
`CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` leídos exclusivamente de
`process.env` en el servidor (signed upload).

## R3

CUANDO la server action `uploadImage` completa exitosamente, el sistema DEBE
retornar la URL segura de la imagen (`https://res.cloudinary.com/<cloud>/...`).

## R4

CUANDO PropertyForm recibe la URL de Cloudinary tras un upload exitoso, el
sistema DEBE agregarla al array `images` del estado del formulario.

## R5

MIENTRAS una imagen se está subiendo a Cloudinary, el sistema DEBE mostrar un
indicador visual de carga (spinner u overlay) en el thumbnail correspondiente.

## R6

CUANDO el admin guarda una propiedad (crear o editar), el sistema DEBE enviar
las URLs de Cloudinary en el campo `images` del payload hacia `saveProperty`.

## R7

El sistema DEBE incluir `res.cloudinary.com` en `remotePatterns` de
`next.config.ts` para permitir el renderizado con el componente `next/image`.

## R8

SI un archivo seleccionado no es una imagen válida (tipo MIME no es
`image/jpeg`, `image/png`, `image/webp` o `image/gif`) ENTONCES el sistema
DEBE rechazar el archivo y mostrar un mensaje de error descriptivo sin invocar
la server action.

## R9

SI un archivo seleccionado excede 5 MB ENTONCES el sistema DEBE rechazar el
archivo y mostrar un mensaje de error descriptivo sin invocar la server action.

## R10

SI la subida a Cloudinary falla (error de red, credenciales inválidas, respuesta
no-2xx) ENTONCES el sistema DEBE mostrar un mensaje de error visible en el
formulario y NO DEBE agregar ninguna URL al array `images` para ese archivo.

## R11

CUANDO la server action `uploadImage` es invocada, el sistema DEBE verificar
que el usuario tiene una sesión activa de admin antes de procesar el upload.

## R12

El módulo de configuración de Cloudinary (`lib/cloudinary.ts`) DEBE leer las
credenciales exclusivamente de variables de entorno del servidor y NO DEBE ser
importado desde ningún Client Component.

## R13

El sistema DEBE incluir tests unitarios que verifiquen: (a) upload exitoso
retorna URL, (b) archivo inválido es rechazado, (c) error de Cloudinary
propaga mensaje de error, (d) sesión no-autenticada es rechazada.

## R14

El sistema DEBE actualizar `docs/architecture.md` con una sección de storage
que refleje Cloudinary como proveedor de imágenes de propiedades.
