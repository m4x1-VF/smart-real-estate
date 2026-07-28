# image-optimization — Tasks

> Feature #5: Optimización de imágenes en cliente antes de subir a Cloudinary.
> Ejecutar en orden. El implementer marca `[x]` al completar cada task.

- [x] T1 — Crear `lib/optimize-image.ts` con constantes `MAX_DIMENSION = 1920`, `JPEG_QUALITY = 0.85` y función `optimizeImage(file: File): Promise<Blob>`. La función usa `createImageBitmap` para decodificar, calcula dimensiones de salida (escala si excede 1920px, preserva si no), dibuja en `OffscreenCanvas`, y retorna Blob JPEG vía `toBlob('image/jpeg', 0.85)`. Cubre: R1, R2, R3, R4, R5, R10.

- [x] T2 — Crear `tests/unit/optimize-image.test.ts` con mocks de `createImageBitmap` y `OffscreenCanvas`. Incluir tests para: (a) imagen 4000x3000 → redimensionada a 1920x1440, (b) imagen 1920x1080 → sin redimensionar, (c) imagen 800x600 → sin redimensionar, (d) `toBlob` llamado con `'image/jpeg'` y `0.85`, (e) Blob resultante tiene `type === 'image/jpeg'`, (f) error cuando `toBlob` retorna null. Cubre: R1, R2, R3, R4, R5.

- [x] T3 — Modificar `components/admin/PropertyForm.tsx`: importar `optimizeImage` desde `@/lib/optimize-image`. En `handleImageChange`, después de la validación de MIME y tamaño, llamar `const optimizedBlob = await optimizeImage(file)`. Construir `const optimizedFile = new File([optimizedBlob], basename + '-optimized.jpg', { type: 'image/jpeg' })`. Usar `optimizedBlob` para el preview (`URL.createObjectURL(optimizedBlob)`) y `optimizedFile` para el `FormData`. Cubre: R6, R7, R8.

- [x] T4 — Verificar que el manejo de errores de optimización funciona en `PropertyForm`: si `optimizeImage()` lanza, el `catch` existente debe capturar el error, remover el placeholder, y mostrar el mensaje en el banner de error. No se necesita código nuevo si el try/catch existente ya cubre este caso — verificar y ajustar si es necesario. Cubre: R9.

- [x] T5 — Ejecutar `pnpm test:run` y verificar que todos los tests pasan (los nuevos de optimize-image y los existentes de cloudinary). Verificar que `pnpm build` compila sin errores. Cubre: R1–R10 (verificación final).
