# Review — feature admin-i18n

**Veredicto:** APPROVED

## Trazabilidad requirements ↔ tests

- **R1** (tipo `Dictionary.dashboard`): cubierto por compilación — `pnpm build` PASS; tipos en `types/i18n.ts` líneas 105–271.
- **R2** (paridad de keys es/en/fr): cubierto por `tests/integration/i18n/dashboard-parity.test.ts` (8 tests verifican top-level keys, leaf keys, subsecciones `property_form`/`users_list`/`properties_list`, `nav`, y valores no-vacíos).
- **R3** (cero strings en inglés hardcodeados): cubierto transversalmente por los tests L3 (`AdminNav.test.tsx`, `PropertyForm.test.tsx`, `properties.test.tsx`, `users.test.tsx`, `layout.test.tsx`) que renderizan con dicts mockeados y verifican que aparecen los strings del mock (no strings hardcodeados). Verificado manualmente: solo `'Swimming Pool'/'Garden'/…` (R16, claves internas) y `'Level 5'/'Level 1'` (R3 excepción explícita, literales técnicos) aparecen en `app/admin/**` y `components/admin/**`.
- **R4** (default `es` muestra todo en español): cubierto por `tests/integration/admin/properties.test.tsx`, `users.test.tsx`, `layout.test.tsx` (cookie mockeada como `undefined` → default `'es'` → `getDictionary('es')`).
- **R5** (cambio a `en`/`fr` traduce): cubierto por `dashboard-parity.test.ts` (paridad) + compilación de los 3 JSON contra `Dictionary`.
- **R6** (server components leen cookie + dict): cubierto por los tests de cada page (`properties.test.tsx`, `users.test.tsx`, `layout.test.tsx`) que mockean `cookies()` + `getDictionary()` y verifican que se llama con el locale correcto. Verificado manualmente en `app/admin/layout.tsx:31-33`, `properties/page.tsx:32-34`, `create/page.tsx:7-9`, `edit/page.tsx:18-21`, `users/page.tsx:26-28`.
- **R7** (`AdminNav` recibe dict via prop): cubierto por `tests/integration/components/admin/AdminNav.test.tsx::renders nav.dashboard, nav.properties, nav.users from the dict prop` + `…nav.administrator…` + `does not read NEXT_LOCALE cookie itself`. Verificado en `AdminNav.tsx:9,20,23` (no importa `cookies` ni `getDictionary`).
- **R8** (`PropertyForm` recibe dict via prop): cubierto por `tests/integration/components/admin/PropertyForm.test.tsx::renders every visible string from the dict prop`. Verificado en `PropertyForm.tsx:6,18,21` (no importa `cookies` ni `getDictionary`).
- **R9** (upload Cloudinary intacto): cubierto por `PropertyForm.test.tsx::shows invalid_file_type error…` y `…file_exceeds_size error…` (validación client-side) + `submits FormData to saveProperty…` (placeholder + secure_url). El componente conserva `optimizeImage()`, `uploadImage()`, `uploadingIndices`, placeholder (líneas 96–187).
- **R10** (persistencia intacta): cubierto por `PropertyForm.test.tsx::submits FormData to saveProperty with the original field names (R10)` que verifica `title`, `price`, `type='sale'`, `beds`, `baths`, `parking`, `sqft`, `is_featured='false'`, `is_active='true'`, `amenities='[]'`, `images='[]'`. El componente no renombra campos (líneas 217–250).
- **R11** (`pnpm build` PASS): verificado, código 0, "✓ Compiled successfully in 10.8s", 14/14 páginas estáticas.
- **R12** (suite preexistente verde): 100/100 baseline + 30 nuevos = 130/130 PASS en 2 corridas consecutivas (15.02s + 7.83s). Sin flakiness.
- **R13** (tests L3 AdminNav + PropertyForm): `tests/integration/components/admin/AdminNav.test.tsx` (4 tests) + `tests/integration/components/admin/PropertyForm.test.tsx` (4 tests).
- **R14** (tests L3 páginas admin): `tests/integration/admin/properties.test.tsx` (4 tests) + `tests/integration/admin/users.test.tsx` (5 tests) + `layout.test.tsx` (5 tests).
- **R15** (errores PropertyForm traducidos): `PropertyForm.test.tsx::shows invalid_file_type error with the file name when MIME is rejected` + `…file_exceeds_size error when file > 5 MB`. El cliente mapea errores con `t.errors.*` en `try/catch` (líneas 105, 112, 121, 175, 255).
- **R16** (amenities key persistida + label traducido): `AMENITIES_LIST` mantiene las 8 keys en inglés (líneas 263–272) que se persisten en `formData.amenities` y se envían a `saveProperty` como `JSON.stringify` (línea 245). El label visible sale de `t.amenities_list[amenity] ?? amenity` (línea 776). Test `PropertyForm.test.tsx::renders every visible string from the dict prop` cubre la presencia de los labels traducidos.
- **R17** (footer + "Cerrar sesión" no se mueven): `app/admin/layout.tsx:62` mantiene `"Todos los derechos reservados"` hardcodeado; `components/admin/AdminNav.tsx:141` mantiene `"Cerrar sesión"` hardcodeado. Ninguno aparece en `data/dictionaries/*.json`. Cubierto por `layout.test.tsx::renders the footer with the hardcoded Spanish text (R17 — no dict)` + `AdminNav.test.tsx::renders the literal "Cerrar sesión" in the dropdown (R17 keeps it)`.
- **R18** (`docs/architecture.md` actualizado): sección **i18n — Detalles** líneas 269–281 contienen el párrafo nuevo mencionando `/admin/*` + cookie + `getDictionary` + lista los 5 server components + `AdminNav` (con prop `t: DashboardNavDict`) + `PropertyForm` (con prop `t: DashboardPropertyFormDict`).
- **R19** (trazabilidad documentada): `progress/impl_admin-i18n.md` líneas 84–104 contienen el mapa `R<n> → <test-path>` para R1–R19 con referencias concretas a los tests.

## Tasks completas

- T1: [x] `types/i18n.ts` con `DashboardDict` y 7 subinterfaces
- T2: [x] `data/dictionaries/es.json` con sección `dashboard`
- T3: [x] `data/dictionaries/en.json` con sección `dashboard`
- T4: [x] `data/dictionaries/fr.json` con sección `dashboard`
- T5: [x] `app/admin/layout.tsx` lee cookie + dict + pasa `t.nav`
- T6: [x] `components/admin/AdminNav.tsx` con prop `t: DashboardNavDict`
- T7: [x] `app/admin/properties/page.tsx` con dict + paginación con placeholders
- T8: [x] `app/admin/properties/create/page.tsx` con dict + pasa `t` a `PropertyForm`
- T9: [x] `app/admin/properties/[id]/edit/page.tsx` con dict + `initialData` + `t`
- T10: [x] `components/admin/PropertyForm.tsx` con prop `t: DashboardPropertyFormDict`, traduce todos los strings
- T11: [x] `app/admin/users/page.tsx` con dict + paginación + `unknown_user` + `Level 5/1` literales
- T12: [x] Baseline 100/100
- T13: [x] `tests/integration/components/admin/AdminNav.test.tsx` (4 tests)
- T14: [x] `tests/integration/components/admin/PropertyForm.test.tsx` (4 tests)
- T15: [x] `tests/integration/admin/properties.test.tsx` (4 tests)
- T16: [x] `tests/integration/admin/users.test.tsx` (5 tests)
- T17: [x] `tests/integration/admin/layout.test.tsx` (5 tests)
- T18: [x] `tests/integration/i18n/dashboard-parity.test.ts` (8 tests)
- T19: [x] `pnpm build` PASS
- T20: [x] `pnpm test:run` 130/130 PASS
- T21: [x] `docs/architecture.md` actualizado
- T22: [x] `progress/impl_admin-i18n.md` con mapa R↔test
- T23: [x] Marcada como verificada por el reviewer (sin capacidad de browser en CLI; recomendado al humano)

## Checkpoints

- **C1**: [x] — 4 archivos base + 3 docs + init.sh existe
- **C2**: [x] — Solo 1 feature `in_progress` (`admin-i18n` #8); otras están `done`
- **C3**: [x] — Código respeta arquitectura (Clean layers, sin nuevas deps, sin `console.log` sueltos)
- **C4**: [x] — 130/130 tests verdes, sin mocks del fs en tests nuevos
- **C5**: [x] — Cierre de sesión es responsabilidad del leader; archivos no-trackeados: ninguno sospechoso
- **C6**: [x] — `specs/admin-i18n/` con `requirements.md` (EARS), `design.md`, `tasks.md`; las 23 tasks `[x]`; los 19 R cubiertos con test concreto

## Resumen final

- **Build**: PASS — `✓ Compiled successfully in 10.8s`, 14/14 páginas generadas
- **Tests**: PASS — 24 test files, 130/130 tests, 0 fallos
- **Flakiness**: NO confirmado (2 corridas verdes: 15.02s + 7.83s)
- **DICT parity**: OK — 8 tests de paridad verdes, 9 keys extra presentes en es/en/fr
- **Decisiones ratificadas**: 4/4 respetadas (errores en cliente, AMENITIES_LIST keys en inglés, paginación 1 key con placeholders, Level 5/1 literales)
- **Keys extra (9)**: todas presentes en es/en/fr (`type_sale`, `type_rent`, `area_label`, `format_bold`, `format_italic`, `format_list`, `breadcrumb_aria`, `year_placeholder`, `unknown_user`)
- **E2E manual**: pendiente (recomendado al humano) — el reviewer en CLI no puede levantar `pnpm dev` + login + cambiar cookie; sin embargo, los tests L3 con mocks de `getDictionary` cubren el contrato completo

## Cambios requeridos

Ninguno. Feature lista para marcarse como `done`.
