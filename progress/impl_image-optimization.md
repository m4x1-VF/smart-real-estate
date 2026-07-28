# image-optimization — Trazabilidad R<n> → Test

> Feature #5: Optimización de imágenes en cliente antes de subir a Cloudinary.

## Mapa de cobertura

| Req | Descripción | Test(s) que lo cubren | Archivo |
|-----|-------------|----------------------|---------|
| R1 | Exporta `optimizeImage(file: File): Promise<Blob>` | Todos los tests que invocan `optimizeImage()` | `tests/unit/optimize-image.test.ts` |
| R2 | Redimensiona si dimensión > 1920px | (a) resizes 4000x3000 image to 1920x1440, portrait images test | `tests/unit/optimize-image.test.ts` |
| R3 | No redimensiona si ambas ≤ 1920px | (b) does not resize 1920x1080, (c) does not resize 800x600 | `tests/unit/optimize-image.test.ts` |
| R4 | Comprime a JPEG 85% | (d) calls convertToBlob with image/jpeg and 0.85 quality | `tests/unit/optimize-image.test.ts` |
| R5 | Blob type es "image/jpeg" | (e) returned Blob has type image/jpeg | `tests/unit/optimize-image.test.ts` |
| R6 | PropertyForm invoca optimizeImage() antes de FormData | Integración en `PropertyForm.tsx` líneas 116-125 | `components/admin/PropertyForm.tsx` |
| R7 | Preview muestra blob optimizado | Integración en `PropertyForm.tsx` línea 134: `URL.createObjectURL(optimizedBlob)` | `components/admin/PropertyForm.tsx` |
| R8 | FormData contiene File optimizado con nombre correcto | Integración en `PropertyForm.tsx` líneas 127-131: `new File([optimizedBlob], basename + '-optimized.jpg')` | `components/admin/PropertyForm.tsx` |
| R9 | Manejo de errores | (f) throws error when convertToBlob returns null, más try/catch en `PropertyForm.tsx` líneas 118-125 | `tests/unit/optimize-image.test.ts` + `components/admin/PropertyForm.tsx` |
| R10 | Optimización aplica a todas las imágenes | Tests (a), (b), (c) verifican diferentes tamaños pasan por optimización | `tests/unit/optimize-image.test.ts` |

## Tests adicionales

- `exports MAX_DIMENSION = 1920` — verifica constante exportada
- `exports JPEG_QUALITY = 0.85` — verifica constante exportada
- `closes the bitmap after drawing` — verifica cleanup de recursos
- `handles portrait images correctly` — verifica aspect ratio en imágenes verticales

## Resultado de verificación

```
✓ 54 tests passed (8 test files)
✓ pnpm build compiled successfully
```

## Notas

- R6, R7, R8 se verifican por integración en `PropertyForm.tsx`, no por tests unitarios específicos (el componente es client-side y requiere browser environment para testing completo).
- La implementación usa `convertToBlob()` en lugar de `toBlob()` porque `OffscreenCanvas` no soporta `toBlob()` en TypeScript DOM types.
- El manejo de errores de optimización se hace antes de crear el placeholder, evitando necesidad de cleanup.
