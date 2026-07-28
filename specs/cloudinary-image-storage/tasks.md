# cloudinary-image-storage — Tasks

> Feature #4 — Checklist ejecutable. El implementer marca `[x]` al completar.
> Cada task referencia los `R<n>` que cubre.

## Setup

- [x] T1 — Instalar dependencia `cloudinary` con `pnpm add cloudinary`. Cubre: R2.

## Adaptador Cloudinary

- [x] T2 — Crear `lib/cloudinary.ts` con `getCloudinary()` (configura `v2` con `process.env.CLOUDINARY_*`) y `uploadImageToCloudinary(fileBuffer, mimeType)` que retorna `secure_url`. Cubre: R2, R3, R12.

## Server Action

- [x] T3 — Añadir server action `uploadImage(formData: FormData)` en `app/admin/properties/actions.ts`: verificar sesión admin, extraer `File`, validar MIME y tamaño, convertir a Buffer, delegar a `uploadImageToCloudinary`, retornar `{ url }`. Cubre: R1, R2, R3, R8, R9, R10, R11.

## Integración en PropertyForm

- [x] T4 — Modificar `handleImageChange` en `components/admin/PropertyForm.tsx`: validar tipo MIME y tamaño client-side, invocar `uploadImage` por cada archivo, agregar URL de Cloudinary al array `images` del formData. Cubre: R1, R4, R8, R9.
- [x] T5 — Añadir estado `uploadingIndices` y mostrar indicador visual de carga (spinner/overlay) en thumbnails durante el upload. Cubre: R5.
- [x] T6 — Manejar errores de upload: remover placeholder del thumbnail fallido y mostrar mensaje en el banner de error existente. Cubre: R10.
- [x] T7 — Verificar que `handleSubmit` envía las URLs de Cloudinary en el campo `images` (sin cambios en `saveProperty`, solo confirmar que el payload es correcto). Cubre: R6.

## Configuración

- [x] T8 — Agregar `{ protocol: 'https', hostname: 'res.cloudinary.com' }` a `remotePatterns` en `next.config.ts`. Cubre: R7.

## Tests

- [x] T9 — Crear `tests/unit/cloudinary.test.ts` con tests: (a) upload exitoso retorna URL, (b) MIME inválido rechazado, (c) tamaño > 5 MB rechazado, (d) error de Cloudinary propaga mensaje, (e) sesión no autenticada rechazada. Cubre: R13.

## Documentación

- [x] T10 — Actualizar `docs/architecture.md`: añadir sección "Storage — Cloudinary" en adaptadores con variables de entorno, flujo de upload y decisión de signed upload. Cubre: R14.
