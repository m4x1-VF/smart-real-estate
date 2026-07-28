# Review — feature #5 image-optimization

**Veredicto:** APPROVED

## Trazabilidad requirements ↔ tests

- R1: [x] cubierto por todos los tests que invocan `optimizeImage()` — `tests/unit/optimize-image.test.ts` líneas 68-190
- R2: [x] cubierto por test `(a) resizes 4000x3000 image to 1920x1440` (línea 68) y `handles portrait images correctly` (línea 175) — verifican `drawImage` llamado con dimensiones escaladas correctamente
- R3: [x] cubierto por tests `(b) does not resize 1920x1080` (línea 89) y `(c) does not resize 800x600` (línea 105) — verifican `drawImage` llamado con dimensiones originales
- R4: [x] cubierto por test `(d) calls convertToBlob with image/jpeg and 0.85 quality` (línea 121) — verifica `convertToBlob` llamado con `{ type: 'image/jpeg', quality: 0.85 }`
- R5: [x] cubierto por test `(e) returned Blob has type image/jpeg` (línea 134) — verifica `result.type === 'image/jpeg'`
- R6: [x] cubierto por integración en `PropertyForm.tsx` línea 119: `optimizedBlob = await optimizeImage(file)` llamada antes de construir `FormData` (línea 141)
- R7: [x] cubierto por integración en `PropertyForm.tsx` línea 134: `URL.createObjectURL(optimizedBlob)` — el preview usa el blob optimizado
- R8: [x] cubierto por integración en `PropertyForm.tsx` líneas 128-131: `new File([optimizedBlob], \`${basename}-optimized.jpg\`, { type: 'image/jpeg' })` y línea 142: `uploadFormData.set('file', optimizedFile)`
- R9: [x] cubierto por test `(f) throws error when convertToBlob returns null` (línea 143) + integración en `PropertyForm.tsx` líneas 118-125: try/catch captura error, llama `setError(message)`, y `continue` salta el upload. No se crea placeholder (mejor que el spec — evita necesidad de cleanup).
- R10: [x] cubierto por tests (a), (b), (c) — verifican que imágenes de todos los tamaños (4000x3000, 1920x1080, 800x600) pasan por optimización sin umbral mínimo.

## Tasks completas

- T1: [x] `lib/optimize-image.ts` creado con `MAX_DIMENSION = 1920`, `JPEG_QUALITY = 0.85`, y función `optimizeImage`. Usa `createImageBitmap` + `OffscreenCanvas` + `convertToBlob`.
- T2: [x] `tests/unit/optimize-image.test.ts` creado con 10 tests (a-f + 4 adicionales: constantes, bitmap cleanup, portrait).
- T3: [x] `PropertyForm.tsx` modificado — importa `optimizeImage`, llama antes de FormData, preview usa blob optimizado, File construido con sufijo `-optimized.jpg`.
- T4: [x] Manejo de errores verificado — try/catch en líneas 118-125 captura errores de optimización, muestra mensaje, no crea placeholder, no invoca upload.
- T5: [x] `pnpm test:run` → 54 tests passed (8 files). `pnpm build` → compiled successfully. `pnpm lint` → clean.

## Checkpoints

- C1 — El arnés está completo:
  - [x] Existen `AGENTS.md`, `feature_list.json`, `progress/current.md`
  - [x] Existen `docs/architecture.md`, `docs/conventions.md`, `docs/verification.md`
  - [ ] `./init.sh` no existe en el repo — **issue pre-existente**, no introducido por esta feature. No bloquea la aprobación de image-optimization.
- C2 — El estado es coherente:
  - [x] Una sola feature `in_progress` (#5 image-optimization) en `feature_list.json`
  - [x] Features `done` (#1-#4) tienen tests que pasan
  - [x] `progress/current.md` describe la sesión activa correctamente
- C3 — El código respeta la arquitectura:
  - [x] `lib/optimize-image.ts` está en capa Adaptadores (`lib/`) — correcto per `docs/architecture.md` §3
  - [x] No se añadieron dependencias en `package.json` — Canvas API es nativa del browser
  - [x] No hay `console.log` de debug ni TODOs sin contexto en los archivos modificados
- C4 — La verificación es real:
  - [x] `tests/unit/optimize-image.test.ts` cubre el módulo `lib/optimize-image.ts`
  - [x] Tests usan mocks de `OffscreenCanvas` y `createImageBitmap` (apropiado para Canvas API que no existe en Node — no aplica la regla de `os.tmpdir()` ya que no hay filesystem involucrado)
  - [x] `pnpm test:run` → 54 tests, todos verdes
- C5 — La sesión se cerró bien:
  - [x] No hay archivos temporales sospechosos
  - [ ] `progress/history.md` — pendiente de actualizar al cerrar sesión (no bloquea review)
  - [x] Feature #5 reflejada como `in_progress` en `feature_list.json`
- C6 — Spec Driven Development:
  - [x] `specs/image-optimization/` tiene `requirements.md`, `design.md`, `tasks.md`
  - [x] `requirements.md` usa EARS estricto (CUANDO/ENTONCES/DEBE/NO DEBE)
  - [x] Todas las tasks T1-T5 marcadas `[x]` en `tasks.md`
  - [x] Cada R1-R10 cubierto por al menos un test (ver trazabilidad arriba)

## Notas de implementación

1. **`convertToBlob` vs `toBlob`**: La implementación usa `OffscreenCanvas.convertToBlob()` en lugar de `toBlob()` mencionado en el design. Esto es correcto — `OffscreenCanvas` no tiene `toBlob()` en TypeScript DOM types. `convertToBlob()` retorna `Promise<Blob>` directamente (más limpio que el callback de `toBlob`). Los tests mockean correctamente este método.

2. **Import ordering menor**: `import { optimizeImage } from '@/lib/optimize-image'` en `PropertyForm.tsx` línea 10 está entre el bloque de dependencias externas y el de componentes locales. Según `docs/conventions.md`, los imports `@/lib/` deberían ir en el tercer bloque (tipos y utilidades). No funcional, solo estético.

3. **Error handling mejorado**: El spec asume que el error de optimización podría requerir cleanup del placeholder. La implementación evita esto llamando `optimizeImage()` antes de crear el placeholder (línea 119 vs línea 134). Diseño más limpio.

## Cambios requeridos

Ninguno para la feature. El `init.sh` faltante (C1) es un issue pre-existente del repo, no introducido por image-optimization.
