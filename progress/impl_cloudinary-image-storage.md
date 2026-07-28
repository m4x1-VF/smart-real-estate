# cloudinary-image-storage — Trazabilidad R→test

> Feature #4 — Mapa de cobertura de requisitos.

| Requirement | Test que lo cubre | Archivo |
|-------------|-------------------|---------|
| R1 — Invocar uploadImage por archivo | `handleImageChange` integration (manual verification) + T4 code review | `components/admin/PropertyForm.tsx` |
| R2 — Auth con env vars (signed upload) | Test (a) upload exitoso + Test (e) sesión no autenticada | `tests/unit/cloudinary.test.ts` |
| R3 — Retornar secure_url | Test (a) returns secure_url on successful upload | `tests/unit/cloudinary.test.ts` |
| R4 — Agregar URL al array images | `handleImageChange` sets formData.images after upload (code review) | `components/admin/PropertyForm.tsx` |
| R5 — Indicador visual de carga | `uploadingIndices` state + overlay rendering (code review) | `components/admin/PropertyForm.tsx` |
| R6 — Enviar URLs en campo images | `handleSubmit` sends `formData.images` as JSON (code review, no change needed) | `components/admin/PropertyForm.tsx` |
| R7 — res.cloudinary.com en remotePatterns | Config check (code review) | `next.config.ts` |
| R8 — Rechazar MIME inválido | Test (b) rejects file with invalid MIME type | `tests/unit/cloudinary.test.ts` |
| R9 — Rechazar archivo > 5 MB | Test (c) rejects file larger than 5MB | `tests/unit/cloudinary.test.ts` |
| R10 — Error de upload visible, no agrega URL | Test (d) propagates Cloudinary error + `handleImageChange` catch block removes placeholder | `tests/unit/cloudinary.test.ts` + `components/admin/PropertyForm.tsx` |
| R11 — Verificar sesión admin | Test (e) rejects unauthenticated session | `tests/unit/cloudinary.test.ts` |
| R12 — Credenciales solo de env vars (server-only) | `import 'server-only'` en `lib/cloudinary.ts` (code review) | `lib/cloudinary.ts` |
| R13 — Tests unitarios | Tests (a)–(e) en `tests/unit/cloudinary.test.ts` | `tests/unit/cloudinary.test.ts` |
| R14 — Documentar arquitectura | Sección "Storage — Cloudinary" agregada | `docs/architecture.md` |
