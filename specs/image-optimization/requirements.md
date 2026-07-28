# image-optimization — Requirements

> Feature #5: Optimización de imágenes en cliente antes de subir a Cloudinary.
> Status: `spec_ready` — esperando aprobación humana.

## R1

El sistema DEBE exportar una función `optimizeImage(file: File): Promise<Blob>`
desde `lib/optimize-image.ts` que acepta un `File` de imagen y retorna un
`Blob` optimizado.

## R2

CUANDO la imagen de entrada tiene al menos una dimensión (ancho o alto) mayor
a 1920px, el sistema DEBE redimensionarla de modo que la dimensión más larga
sea exactamente 1920px y la otra mantenga el aspect ratio original.

## R3

CUANDO la imagen de entrada tiene ambas dimensiones (ancho y alto) menores o
iguales a 1920px, el sistema NO DEBE alterar las dimensiones originales.

## R4

El sistema DEBE comprimir la imagen de salida a formato JPEG con calidad 85%
(`quality: 0.85` en `canvas.toBlob`).

## R5

El Blob retornado por `optimizeImage` DEBE tener `type` igual a
`"image/jpeg"`, independientemente del formato de entrada (PNG, WEBP, GIF).

## R6

CUANDO el usuario selecciona una imagen en `PropertyForm`, el sistema DEBE
invocar `optimizeImage()` sobre el `File` antes de construir el `FormData`
que se envía a la server action `uploadImage`.

## R7

El preview de imagen en `PropertyForm` DEBE mostrar el contenido del Blob
optimizado (vía `URL.createObjectURL` del Blob resultante), no el del
archivo original.

## R8

El `FormData` enviado a la server action `uploadImage` DEBE contener un
`File` construido a partir del Blob optimizado, con nombre
`<original-name-basename>-optimized.jpg` y tipo `image/jpeg`, de modo que
la server action y el adaptador Cloudinary no requieran modificaciones.

## R9

SI `optimizeImage()` lanza una excepción ENTONCES `PropertyForm` DEBE
mostrar el mensaje de error al usuario, eliminar el preview placeholder y
NO invocar la server action `uploadImage`.

## R10

La optimización DEBE aplicarse a toda imagen seleccionada, sin importar su
tamaño en bytes original (no hay umbral mínimo para omitir la optimización).
