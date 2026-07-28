# Review — feature #4 cloudinary-image-storage

**Veredicto:** APPROVED

## Trazabilidad requirements ↔ tests

- R1: [x] cubierto por test (a) `returns secure_url on successful upload` + code review de `PropertyForm.tsx` L92-167 (`handleImageChange` invoca `uploadImage` por cada archivo)
- R2: [x] cubierto por test (a) + test (e) — `lib/cloudinary.ts` L9-11 lee `process.env.CLOUDINARY_*` exclusivamente
- R3: [x] cubierto por test (a) — verifica `result.url === 'https://res.cloudinary.com/...'`
- R4: [x] cubierto por code review `PropertyForm.tsx` L133-137 (`setFormData` agrega `result.url` al array `images`)
- R5: [x] cubierto por code review `PropertyForm.tsx` L469-480 (overlay con spinner cuando `uploadingIndices.has(index)`)
- R6: [x] cubierto por code review `PropertyForm.tsx` L229 (`formPayload.set('images', JSON.stringify(formData.images ?? []))`)
- R7: [x] cubierto por code review `next.config.ts` L26-29 (`{ protocol: 'https', hostname: 'res.cloudinary.com' }`)
- R8: [x] cubierto por test (b) `rejects file with invalid MIME type` — verifica error + que Cloudinary NO es invocado
- R9: [x] cubierto por test (c) `rejects file larger than 5MB` — verifica error + que Cloudinary NO es invocado
- R10: [x] cubierto por test (d) `propagates Cloudinary error message` + code review `PropertyForm.tsx` L138-158 (catch remueve placeholder y muestra error)
- R11: [x] cubierto por test (e) `rejects unauthenticated session` — verifica que session null → error
- R12: [x] cubierto por code review `lib/cloudinary.ts` L1 (`import 'server-only'`) + L9-11 (solo `process.env`)
- R13: [x] cubierto por tests (a)-(e) en `tests/unit/cloudinary.test.ts`
- R14: [x] cubierto por code review `docs/architecture.md` L251-266 (sección "Storage — Cloudinary")

## Tasks completas

- T1: [x] — `cloudinary` instalado (package.json + pnpm-lock.yaml en diff)
- T2: [x] — `lib/cloudinary.ts` creado con `getCloudinary()` + `uploadImageToCloudinary()`
- T3: [x] — `uploadImage` server action en `actions.ts` L176-202
- T4: [x] — `handleImageChange` en `PropertyForm.tsx` L92-168
- T5: [x] — `uploadingIndices` state + overlay spinner `PropertyForm.tsx` L47-49, L469-480
- T6: [x] — catch block remueve placeholder y muestra error `PropertyForm.tsx` L138-158
- T7: [x] — `handleSubmit` envía URLs en campo images `PropertyForm.tsx` L229
- T8: [x] — `res.cloudinary.com` en remotePatterns `next.config.ts` L26-29
- T9: [x] — `tests/unit/cloudinary.test.ts` con 5 tests (a-e)
- T10: [x] — Sección "Storage — Cloudinary" en `docs/architecture.md` L251-266

## Checkpoints

- C1: [x] — `AGENTS.md` ✅, `feature_list.json` ✅, `progress/current.md` ✅, `docs/architecture.md` ✅, `docs/conventions.md` ✅, `docs/verification.md` ✅. Nota: `init.sh` no existe en el repo (issue pre-existente, no introducido por esta feature).
- C2: [x] — Una sola feature `in_progress` (#4). Tests de features done (#1-#3) pasan.
- C3: [x] — `lib/cloudinary.ts` respeta capa de Adaptadores. `cloudinary` package justificado en architecture.md. Sin `console.log` de debug (los `console.error` en actions.ts son patrón pre-existente para logging de errores).
- C4: [x] — `tests/unit/cloudinary.test.ts` tiene 5 tests para el módulo cloudinary. `pnpm test:run` → 44 tests, todos verdes.
- C5: [x] — Sin archivos temporales sospechosos. Feature #4 en estado correcto (`in_progress` para review).
- C6: [x] — Carpeta `specs/cloudinary-image-storage/` con los 3 archivos. EARS estricto en requirements.md. Todas las tasks `[x]`. Cada R<n> cubierto por test.

## Verificación ejecutada

| Check | Resultado |
|-------|-----------|
| `pnpm test:run` | ✅ 44/44 tests passed (7 files, 2.64s) |
| `pnpm lint` | ⚠️ 4 errores TS2339 en `tests/unit/auth/social-providers.test.ts` — **pre-existentes de feature #3**, no introducidos por esta feature |
| `npx tsc --noEmit` | ⚠️ Mismos 4 errores pre-existentes en `social-providers.test.ts` |

## Notas

- Los errores de TypeScript en `tests/unit/auth/social-providers.test.ts` (L20-24) son pre-existentes de la feature #3 (auth-ui). La feature #4 no tocó ese archivo. No bloquean la aprobación de esta feature pero deberían resolverse en un follow-up.
- `init.sh` no existe en el repositorio. Es un issue de setup del proyecto, no introducido por esta feature.
- La implementación es limpia: separación de responsabilidades (adaptador `lib/cloudinary.ts` ↔ server action `actions.ts` ↔ UI `PropertyForm.tsx`), validación dual client+server, manejo de errores consistente con el patrón existente.
