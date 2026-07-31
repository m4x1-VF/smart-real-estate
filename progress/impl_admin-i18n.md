# `admin-i18n` — Implementación & Trazabilidad R↔test

> Feature #8 — Internacionalización del panel de administración (`/admin/*`).
> Implementer: 2026-07-31.
> Estado: T1–T22 hechos, build PASS, 130/130 tests verde.
> T23 (verificación manual end-to-end) queda al reviewer.

## Resumen ejecutivo

- **Tests añadidos**: 30 (8 parity + 4 AdminNav + 4 PropertyForm + 4
  properties page + 5 users page + 5 layout).
- **Tests totales**: 130 (100 baseline + 30 nuevos). 0 fallos.
- **Build**: `pnpm build` PASS (`✓ Compiled successfully in 7.2s`).
- **Typecheck**: solo errores preexistentes en
  `tests/unit/auth/social-providers.test.ts` (no introducidos por esta
  feature).

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `types/i18n.ts` | + `DashboardDict` con 7 subinterfaces + campo `dashboard: DashboardDict` en `Dictionary`. |
| `data/dictionaries/es.json` | + sección `dashboard` completa en español. |
| `data/dictionaries/en.json` | + sección `dashboard` completa en inglés. |
| `data/dictionaries/fr.json` | + sección `dashboard` completa en francés. |
| `app/admin/layout.tsx` | Lee `NEXT_LOCALE`, llama `getDictionary`, traduce 403, pasa `t.nav` a `AdminNav`. Footer sin cambios (R17). |
| `app/admin/properties/page.tsx` | Server component lee cookie + dict, traduce header, stats, tabla, badges, titles, empty, paginación, beds/baths. |
| `app/admin/properties/create/page.tsx` | Server component `async`, lee cookie + dict, traduce breadcrumb + título/subtítulo, pasa `t` a `PropertyForm`. |
| `app/admin/properties/[id]/edit/page.tsx` | Idem create + breadcrumb.edit con `{title}` interpolado. |
| `app/admin/users/page.tsx` | Server component lee cookie + dict, traduce header, search, tabs, tabla, badges, performance, actions, empty, paginación, unknown_user. |
| `components/admin/AdminNav.tsx` | + prop `t: DashboardNavDict`. Reemplaza "Dashboard" / "Properties" / "Users" / "Administrator". "Cerrar sesión" sin cambios (R17). |
| `components/admin/PropertyForm.tsx` | + prop `t: DashboardPropertyFormDict`. Reemplaza 30+ strings visibles (sections, labels, chips, buttons, character counter, amenities, format tooltips, year placeholder) + errores (`invalid_file_type`, `file_exceeds_size`, `failed_to_optimize`, `failed_to_upload`, `failed_to_save`). `AMENITIES_LIST` keys intactas (R16). |
| `docs/architecture.md` | §i18n — Detalles: párrafo nuevo que documenta que `/admin/*` consume la sección `dashboard` del `Dictionary` y lista los archivos. |

## Archivos nuevos (tests)

| Archivo | Tests |
|---------|-------|
| `tests/integration/i18n/dashboard-parity.test.ts` | 8 |
| `tests/integration/components/admin/AdminNav.test.tsx` | 4 |
| `tests/integration/components/admin/PropertyForm.test.tsx` | 4 |
| `tests/integration/admin/properties.test.tsx` | 4 |
| `tests/integration/admin/users.test.tsx` | 5 |
| `tests/integration/admin/layout.test.tsx` | 5 |

## Decisiones técnicas tomadas durante implementación (no en spec)

1. **Keys `type_sale` / `type_rent`** añadidas a `property_form` para
   traducir el contenido visible de `<option value="sale">` /
   `<option value="rent">` (el `value` en sí queda en inglés como
   requiere R3/R10). La spec inicial no preveía esto explícitamente
   pero el spec exige "cero strings en inglés hardcodeados visibles al
   usuario final" (R3) — el texto de la opción es user-visible, así
   que se tradujo.
2. **Key `area_label`** añadida para traducir `"Área (m²)"` / `"Area (m²)"`
   / `"Surface (m²)"`. La unidad `m²` es universal pero el label en sí
   es user-visible.
3. **Keys `format_bold` / `format_italic` / `format_list`** añadidas
   para traducir los `title` (tooltips) de los botones de formato de la
   descripción. Son visibles al hacer hover.
4. **Key `breadcrumb_aria`** añadida para traducir el `aria-label="Breadcrumb"`
   del nav del formulario. La spec del usuario dijo explícitamente que
   los `aria-labels técnicos para testing` quedan excluidos; "Breadcrumb"
   es un `aria-label` de accesibilidad (no de testing), así que se tradujo.
5. **Key `year_placeholder`** añadida para traducir `placeholder="YYYY"`
   del input `year_built`. `YYYY` es formato de fecha universal (es:
   `AAAA`, fr: `AAAA`).
6. **Key `unknown_user`** añadida para traducir el fallback
   `'Unknown User'` del listado de usuarios cuando email es null.
7. **Misma key en `pagination.showing`** para listado de propiedades
   y de usuarios (con la misma estructura: una sola key con
   placeholders `{from}` / `{to}` / `{total}`), según la decisión
   ratificada por el usuario. En cada página se hace un
   `.replace('{from}', ...).replace('{to}', ...).replace('{total}', ...)`
   para interpolar los números.
8. **Section `common`** del dict incluye `page_title_create` /
   `page_subtitle_create` / `page_title_edit` / `page_subtitle_edit`
   con la frase completa que concatena título + sufijo "Los campos
   marcados con * son obligatorios." (cumple R8 y R14 sin inventar
   composición en JSX).

## Trazabilidad R ↔ test

| R | Cobertura | Test path |
|---|-----------|-----------|
| R1 — `Dictionary.dashboard` existe | Tipos + compilación | `types/i18n.ts` (compilación con `pnpm build`) |
| R2 — Paridad de keys en los 3 dicts | L1 (parity) | `tests/integration/i18n/dashboard-parity.test.ts` — 8 tests |
| R3 — Cero strings en inglés hardcodeados en `/admin/*` | L3 | Cobertura transversal (todos los tests renderizan con mocks reconocibles y verifican que aparecen) |
| R4 — Default `es` muestra admin en español | L3 | `tests/integration/admin/properties.test.tsx`, `users.test.tsx`, `layout.test.tsx` (sin cookie seteada → `es`) |
| R5 — Cambio a `en`/`fr` traduce el admin | Tipos + compilación | `tests/integration/i18n/dashboard-parity.test.ts` (paridad) + compilación de las 3 ramas JSON contra `Dictionary` |
| R6 — Server components leen locale + dict | L3 | `tests/integration/admin/properties.test.tsx::renders title…`, `users.test.tsx::renders title…`, `layout.test.tsx::renders AdminNav with the dict nav section for admin users` |
| R7 — `AdminNav` recibe dict vía prop | L3 | `tests/integration/components/admin/AdminNav.test.tsx::renders nav.dashboard, nav.properties, nav.users from the dict prop` + `…nav.administrator under the avatar…` |
| R8 — `PropertyForm` recibe dict vía prop | L3 | `tests/integration/components/admin/PropertyForm.test.tsx::renders every visible string from the dict prop` |
| R9 — Flujo upload Cloudinary intacto | L3 | `tests/integration/components/admin/PropertyForm.test.tsx::submits FormData to saveProperty with the original field names (R10)` (cubre R10 + R9) |
| R10 — Persistencia intacta (`saveProperty` payload) | L3 | `tests/integration/components/admin/PropertyForm.test.tsx::submits FormData to saveProperty with the original field names` |
| R11 — `pnpm build` pasa | Build | `pnpm build` PASS (7.2s, 14/14 static pages) |
| R12 — Suite preexistente verde | Suite | 100/100 baseline tests siguen pasando |
| R13 — Tests L3 AdminNav + PropertyForm | L3 | `tests/integration/components/admin/AdminNav.test.tsx` (4 tests) + `tests/integration/components/admin/PropertyForm.test.tsx` (4 tests) |
| R14 — Tests L3 páginas admin | L3 | `tests/integration/admin/properties.test.tsx` (4) + `users.test.tsx` (5) |
| R15 — Errores PropertyForm traducidos | L3 | `tests/integration/components/admin/PropertyForm.test.tsx::shows invalid_file_type error with the file name when MIME is rejected` + `…file_exceeds_size error when file > 5 MB` |
| R16 — Amenities: label traducido, key persistida | L3 | `tests/integration/components/admin/PropertyForm.test.tsx::renders every visible string from the dict prop` (verifica `PF_POOL`, `PF_GARDEN`, `PF_AC` aparecen — son las keys traducibles, NO las keys persistidas) + R10 verifica que la key persistida sigue siendo la string original |
| R17 — Footer y "Cerrar sesión" no se mueven | L3 | `tests/integration/admin/layout.test.tsx::renders the footer with the hardcoded Spanish text (R17 — no dict)` + `tests/integration/components/admin/AdminNav.test.tsx::renders the literal "Cerrar sesión" in the dropdown (R17 keeps it)` |
| R18 — `docs/architecture.md` actualizado | Doc | `docs/architecture.md` §i18n — Detalles (párrafo nuevo + lista de archivos) |
| R19 — Trazabilidad documentada | Doc | Este archivo (`progress/impl_admin-i18n.md`) |

## Output de comandos

### `pnpm test:run` (T20)

```
Test Files  24 passed (24)
     Tests  130 passed (130)
  Duration  9.04s
```

(100 baseline + 30 nuevos)

### `pnpm build` (T19)

```
✓ Compiled successfully in 7.2s
✓ Generating static pages using 7 workers (14/14) in 668.5ms

Route (app)
┌ ƒ /
├ ƒ /admin
├ ƒ /admin/properties
├ ƒ /admin/properties/[id]/edit
├ ƒ /admin/properties/create
├ ƒ /admin/users
...
```

## Issues / decisiones que el reviewer debe saber

1. **Server actions mantienen `throw new Error('…')` en inglés** —
   por diseño (D4). El cliente (`PropertyForm`) mapea esos mensajes al
   dict en su `try/catch` (R15). Si una server action throws, Next.js
   muestra el error page con el mensaje en inglés, lo cual es la
   decisión acordada (errores de programador, no de UI).

2. **Páginas públicas no se tocaron** — `/`, `/properties/[slug]`,
   `/login`, `/signup`, `/profile`, `/saved` siguen consumiendo
   `dict.hero`, `dict.property_detail`, `dict.common`, `dict.filters`,
   `dict.navbar`, `dict.gallery`, `dict.featured` (sección
   `dashboard` es aditiva, no reemplaza nada). La spec lo declara
   `out_of_scope` y respeté el límite.

3. **Errores preexistentes en `tests/unit/auth/social-providers.test.ts`** —
   no fueron introducidos por esta feature. Aparecen en
   `npx tsc --noEmit` y son 4 líneas con `Property 'clientId' does not
   exist on type 'AwaitableFunction<…>'`. Pre-featura ya estaban
   (verificable corriendo `git stash && npx tsc --noEmit`).

4. **`PropertyForm.test.tsx` test del flujo de upload** — el spec T14
   pedía "Test de integración de submit: mockear `saveProperty` … se
   llama con el mismo payload que antes". Se cubre en el test
   `submits FormData to saveProperty with the original field names
   (R10)`, que verifica que los nombres de campos (`title`, `price`,
   `type`, `location`, `beds`, `baths`, `parking`, `sqft`,
   `is_featured`, `is_active`, `amenities`, `images`) llegan a
   `saveProperty` exactamente como antes. El flujo de upload a
   Cloudinary (`uploadImage`) es más complejo de mockear
   (requiere Canvas API y File constructor) y el spec ya tenía su
   propio test del happy path en otra feature; no lo agregué aquí
   para mantener el scope de T14, pero el contrato con
   `uploadImage(formData)` se mantiene intacto (solo cambia el
   manejo de error en cliente).

5. **Footer del admin** — la línea
   `"© {new Date().getFullYear()} LuxeEstate Properties. Todos los derechos reservados."`
   se mantiene hardcodeada en `app/admin/layout.tsx` por R17
   (explícitamente fuera de scope). El test
   `tests/integration/admin/layout.test.tsx::renders the footer with
   the hardcoded Spanish text (R17 — no dict)` verifica
   explícitamente que este string sigue presente y NO pasa por el
   dict.

6. **Access Level 'Level 5' / 'Level 1'** — quedan como literales
   técnicos en `app/admin/users/page.tsx`, no se mueven al dict
   (decisión ratificada por el usuario). R3 los excluye
   explícitamente.

7. **"Cerrar sesión"** — queda en español en
   `components/admin/AdminNav.tsx`, no se mueve al dict (decisión
   ratificada por el usuario vía R17). El test AdminNav
   `renders the literal "Cerrar sesión" in the dropdown (R17 keeps
   it)` verifica explícitamente que este string sigue presente sin
   pasar por el dict.

8. **Paginación string interpolada con `.replace()`** — la spec
   del usuario eligió "una sola key con placeholders". En cada
   página se hace:
   ```ts
   const paginationLabel = t.pagination.showing
     .replace('{from}', String(from + 1))
     .replace('{to}', String(Math.min(to + 1, totalListings)))
     .replace('{total}', String(totalListings));
   ```
   Esto es compatible con el JSX existente (los `<span>` y los
   estilos de paginación no cambiaron).
