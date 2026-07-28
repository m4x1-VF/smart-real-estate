# image-optimization — Design

> Feature #5: Optimización de imágenes en cliente antes de subir a Cloudinary.

## Archivos a crear

| Archivo | Capa | Responsabilidad |
|---------|------|-----------------|
| `lib/optimize-image.ts` | Adaptadores | Función pura `optimizeImage(file: File): Promise<Blob>`. Usa Canvas API para redimensionar y comprimir. |
| `tests/unit/optimize-image.test.ts` | Tests | Tests unitarios de `optimizeImage` con mocks de Canvas API (entorno `node`). |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `components/admin/PropertyForm.tsx` | Importar `optimizeImage`. En `handleImageChange`, llamar `optimizeImage(file)` antes de construir `FormData`. El preview y el upload usan el Blob optimizado. |

## Archivos que NO se modifican

- `lib/cloudinary.ts` — adaptador Cloudinary sin cambios.
- `app/admin/properties/actions.ts` — server action `uploadImage` sin cambios.
- `vitest.config.ts` — sin cambios (los tests de optimize-image mockean Canvas API en entorno `node`).

## Firmas nuevas

```typescript
// lib/optimize-image.ts

export const MAX_DIMENSION = 1920;
export const JPEG_QUALITY = 0.85;

/**
 * Redimensiona (si excede MAX_DIMENSION) y comprime (JPEG 85%) una imagen
 * usando Canvas API. Retorna un Blob con type "image/jpeg".
 */
export function optimizeImage(file: File): Promise<Blob>;
```

### Contrato de `optimizeImage`

1. Decodifica el `File` con `createImageBitmap(file)`.
2. Calcula dimensiones de salida:
   - Si `max(width, height) > MAX_DIMENSION`: escala proporcionalmente para que la dimensión mayor sea `MAX_DIMENSION`.
   - Si no: usa las dimensiones originales.
3. Crea un `OffscreenCanvas` (o `HTMLCanvasElement` como fallback) con las dimensiones de salida.
4. Dibuja la imagen con `canvas.getContext('2d').drawImage(...)`.
5. Convierte a Blob con `canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)`.
6. Si `toBlob` retorna `null` (error de canvas), rechaza la promesa con `Error('Image optimization failed: canvas returned null')`.

### Integración en PropertyForm

En `handleImageChange`, el flujo actual es:

```
file → validation → URL.createObjectURL(file) → preview → FormData(file) → uploadImage()
```

El flujo nuevo es:

```
file → validation → optimizeImage(file) → Blob
  → URL.createObjectURL(blob) → preview
  → new File([blob], '<name>-optimized.jpg', { type: 'image/jpeg' })
  → FormData(optimizedFile) → uploadImage()
```

El nombre del archivo optimizado se genera así:
- Quitar extensión del nombre original: `photo.png` → `photo`
- Añadir sufijo y extensión JPEG: `photo-optimized.jpg`

## Excepciones

No se introducen clases de error nuevas. `optimizeImage` lanza `Error` estándar
con mensaje descriptivo si:
- `createImageBitmap` falla (archivo corrupto o formato no soportado).
- `canvas.toBlob` retorna `null`.

`PropertyForm` captura estos errores en el `catch` existente del `try/catch`
del loop de upload y los muestra en el banner de error.

## Alternativa descartada

**Optimización server-side con `sharp`**: se descartó porque:
1. Añade latencia de upload — la imagen sin optimizar (1.8MB+) viaja completa al servidor antes de procesarse.
2. Consume CPU/memoria del servidor Node.js en cada upload.
3. No reduce el tiempo de upload percibido por el usuario.
4. La decisión ya está tomada en `feature_list.json`: Canvas API en cliente.

**Optimización solo si supera umbral de bytes**: se descartó porque:
1. Añadir complejidad condicional sin beneficio claro.
2. Una imagen de 800KB puede beneficiarse de compresión JPEG 85% igualmente.
3. Consistencia: todas las imágenes pasan por el mismo pipeline.

## Consideraciones de testing

El entorno de Vitest es `node` (ver `vitest.config.ts`). Canvas API y
`createImageBitmap` no existen en Node.js nativo. Los tests deben:

1. Mockear `globalThis.createImageBitmap` para retornar un objeto con
   `width` y `height` configurables.
2. Mockear `OffscreenCanvas` (o `HTMLCanvasElement`) con un `getContext('2d')`
   que expose `drawImage` como spy y un `toBlob` que retorne un `Blob`
   controlado.
3. Verificar que `drawImage` se llama con las dimensiones correctas.
4. Verificar que `toBlob` se llama con `'image/jpeg'` y `0.85`.
