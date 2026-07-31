# Tasks — `admin-i18n`

> Checklist ejecutable. Cada task referencia los `R<n>` que cubre.
> El implementer marca `[x]` al completar; el reviewer rechaza si
> queda algún `[ ]` sin justificación documentada.
>
> **Regla dura**: NO se marca una task `[x]` si su test asociado (si
> aplica) no pasa en verde.

---

## Bloque 1 — Modelo y diccionarios (R1, R2)

- [x] **T1** — En `types/i18n.ts`, añadir las interfaces `DashboardNavDict`,
      `DashboardLayoutDict`, `DashboardPropertiesListDict`,
      `DashboardPropertyFormDict`, `DashboardUsersListDict`,
      `DashboardCommonDict`, `DashboardErrorsDict` y `DashboardDict`,
      y añadir el campo `dashboard: DashboardDict` a `Dictionary`.
      Cubre: **R1**.

- [x] **T2** — En `data/dictionaries/es.json`, añadir la sección
      `"dashboard"` con todas las subsecciones completas y strings
      en español. Cubre: **R2**, **R4**.

- [x] **T3** — En `data/dictionaries/en.json`, añadir la sección
      `"dashboard"` con las **mismas keys** que `es.json` y strings
      en inglés. Cubre: **R2**, **R5**.

- [x] **T4** — En `data/dictionaries/fr.json`, añadir la sección
      `"dashboard"` con las **mismas keys** que `es.json` y `en.json`
      y strings en francés. Cubre: **R2**, **R5**.

---

## Bloque 2 — Layout y AdminNav (R6, R7, R17)

- [x] **T5** — En `app/admin/layout.tsx`:
      - Importar `cookies` de `next/headers` y `getDictionary` de `@/lib/i18n`.
      - Leer `locale` desde cookie `NEXT_LOCALE` con default `'es'`.
      - Reemplazar `"403"` y `"You do not have permission to access this area."`
        por `t.layout.forbidden_title` y `t.layout.forbidden_message`.
      - Pasar `t.nav` como prop `t` al `<AdminNav />`.
      - **NO tocar** el footer (R17).
      Cubre: **R6**, **R7**, **R17**.

- [x] **T6** — En `components/admin/AdminNav.tsx`:
      - Añadir prop `t: DashboardNavDict` a `AdminNavProps`.
      - Reemplazar los strings `"Dashboard"`, `"Properties"`,
        `"Users"` por `t.dashboard`, `t.properties`, `t.users`.
      - Reemplazar el label `"Administrator"` bajo el avatar por
        `t.administrator`.
      - **NO tocar** `"Cerrar sesión"` (R17).
      Cubre: **R3**, **R7**, **R17**.

---

## Bloque 3 — Listado de propiedades (R3, R6, R14)

- [x] **T7** — En `app/admin/properties/page.tsx`:
      - Leer cookie + dict (igual patrón que `app/page.tsx`).
      - Reemplazar todos los strings listados en R3/R14:
        - Header: `t.properties_list.title`, `t.properties_list.subtitle`.
        - Botón: `t.properties_list.add_new_property`.
        - Stats: `t.properties_list.stats.{total_listings, active_listings, inactive_listings}`.
        - Tabla: `t.properties_list.table.{property_details, price, status, actions}`.
        - Badges: `t.properties_list.badges.{active, inactive, featured}`.
        - Titles de hover: `t.properties_list.titles.{edit_property, activate_property, deactivate_property}`.
        - Empty: `t.properties_list.empty`.
        - Paginación: `t.properties_list.pagination.showing` con los
          placeholders `{from}`, `{to}`, `{total}` (ver nota más
          abajo sobre format string).
      - NO traducir `'Hab'` y `'Baños'` si la feature decide que
        siguen siendo "Habitaciones"/"Baños" en español — si se
        traducen, agregar a `t.properties_list` la subsección
        `beds_baths: { hab, baños }`.
      Cubre: **R3**, **R6**, **R14**.

> **Nota sobre `showing`**: el patrón actual es JSX con `<span>` y
> números interpolados a mano. Para no romper markup, la
> implementación tiene dos opciones equivalentes:
> 1. Reemplazar por un helper `formatPagination(t, from, to, total)`
>    que arme la frase.
> 2. Pasar 4 strings separadas a `dashboard.properties_list.pagination`
>    (`label_before`, `label_between`, `label_of`, `label_results`)
>    y mantener el JSX existente.
>
> La decisión final la toma el implementer; ambas cumplen R3/R14. El
> test verifica el output renderizado, no la forma del dict.

---

## Bloque 4 — Crear / Editar propiedad (R3, R6, R8, R15, R16)

- [x] **T8** — En `app/admin/properties/create/page.tsx`:
      - Leer cookie + dict.
      - Reemplazar `"Properties"`, `"Add New"` del breadcrumb por
        `t.breadcrumb.properties` y `t.breadcrumb.add_new`.
      - Reemplazar `<h1>"Add New Property"</h1>` por
        `t.basic_information` — no, mejor `t.page_title_create`
        (subsección `common`).
      - Reemplazar el subtítulo por `t.page_subtitle_create` con el
        sufijo de campos obligatorios (`t.common.fields_mandatory`).
      - Pasar `t` como prop a `<PropertyForm t={t} />`.
      Cubre: **R3**, **R6**, **R8**.

- [x] **T9** — En `app/admin/properties/[id]/edit/page.tsx`:
      - Idem T8 pero con `t.page_title_edit`, `t.page_subtitle_edit`
        y `t.breadcrumb.edit` (interpolando `{title}` con el
        `property.title`).
      - Pasar `t` y `initialData` a `<PropertyForm t={t} initialData={property} />`.
      Cubre: **R3**, **R6**, **R8**.

- [x] **T10** — En `components/admin/PropertyForm.tsx`:
      - Añadir prop `t: DashboardPropertyFormDict` a `PropertyFormProps`.
      - Reemplazar **todos** los strings listados en R3/R15/R16:
        - Sections: `t.basic_information`, `t.description_title`,
          `t.gallery`, `t.location`, `t.details`, `t.amenities_title`.
        - Labels y chips: `t.featured`, `t.active`, `t.inactive`,
          `t.property_title`, `t.price`, `t.property_type`,
          `t.address`, `t.latitude`, `t.longitude`, `t.map_location`,
          `t.year_built`, `t.bedrooms`, `t.bathrooms`, `t.parking`,
          `t.file_formats`, `t.drop_zone`, `t.max_size`, `t.uploading`,
          `t.main`.
        - Buttons: `t.cancel`, `t.save`, `t.save_property`.
        - Character counter: `t.character_counter` con `{count}`
          interpolado (`{formData.description.length} / 2000`).
        - Amenities: cada label se renderiza como
          `t.amenities_list[amenity] ?? amenity` (R16).
      - **Errores (R15)**:
        - `Invalid file type "{file.name}". Accepted: ...` →
          `t.errors.invalid_file_type` con `{name}` y la lista de
          formatos (los formatos se mantienen porque ya son los
          nombres técnicos de MIME types).
        - `File "{file.name}" exceeds maximum size of 5MB.` →
          `t.errors.file_exceeds_size` con `{name}`.
        - Fallback `optimizeImage` → `t.errors.failed_to_optimize`.
        - Fallback `uploadImage` → `t.errors.failed_to_upload`.
        - Fallback `saveProperty` → `t.errors.failed_to_save`.
      - **NO tocar**: el payload `FormData` de `handleSubmit`
        (R10), `ALLOWED_MIME_TYPES`, `MAX_FILE_SIZE`, `AMENITIES_LIST`
        como keys (R16), los `<option value="sale">` y
        `<option value="rent">` (R3), ni el `id`/`name` de los
        inputs (R3, R10).
      Cubre: **R3**, **R8**, **R9**, **R10**, **R15**, **R16**.

---

## Bloque 5 — Listado de usuarios (R3, R6, R14)

- [x] **T11** — En `app/admin/users/page.tsx`:
      - Leer cookie + dict.
      - Reemplazar:
        - Header: `t.title`, `t.subtitle`.
        - Search: `t.search_placeholder`.
        - Add User button: `t.add_user`.
        - Tabs: `t.tabs.{all, agents, brokers, admins}`.
        - Tabla: `t.table.{user_details, role_status, performance, actions}`.
        - Badges: `t.badges.{administrator, user, active}`.
        - Performance labels: `t.performance.{properties, access_level}`.
        - Button de acción: `t.actions.{make_admin, remove_admin}`
          según `user.role`.
        - Empty: `t.empty`.
        - Paginación: `t.pagination.showing` (mismo criterio que T7).
      - `Level 5` / `Level 1` (Access Level): **NO traducir el número**
        (es un valor semántico técnico). Si se quiere, agregar al
        dict `t.performance.level_5` / `t.performance.level_1` —
        decisión de implementer. Por defecto se mantienen los
        literales `"Level 5"` / `"Level 1"` (R3 los excluye como
        valores técnicos).
      - `ID: #XXXX`: queda igual (es el `id` truncado, no copy).
      Cubre: **R3**, **R6**, **R14**.

---

## Bloque 6 — Tests (R12, R13, R14)

- [x] **T12** — Verificar que `pnpm test:run` pasa con la suite
      preexistente al 100 % **antes** de empezar cambios de tests.
      Baseline. Cubre: **R12**.

- [x] **T13** — Crear `tests/components/admin/AdminNav.test.tsx`
      (L3 — React Testing Library):
      - Mockear el dict `DashboardNavDict` con valores reconocibles
        (ej. `'NAV_DASH'`, `'NAV_PROPS'`, `'NAV_USERS'`,
        `'NAV_ADMIN'`).
      - Renderizar `<AdminNav user={mockUser} t={mockT} />`.
      - Verificar que el texto `NAV_DASH`, `NAV_PROPS`, `NAV_USERS`
        y `NAV_ADMIN` aparece en el output.
      - Verificar que el texto literal `'Cerrar sesión'` (sin
        traducir) sigue presente.
      Cubre: **R7**, **R13**.

- [x] **T14** — Crear `tests/components/admin/PropertyForm.test.tsx`
      (L3 — RTL):
      - Mockear el dict con valores reconocibles
        (`'PF_BASIC'`, `'PF_DESC'`, `'PF_GALLERY'`, `'PF_LOC'`,
        `'PF_DET'`, `'PF_AMEN'`, `'PF_CANCEL'`, `'PF_SAVE'`,
        `'PF_ERR_INVALID'`, `'PF_ERR_SIZE'`, `'PF_ERR_OPT'`,
        `'PF_ERR_UPL'`, `'PF_ERR_SAVE'`).
      - Renderizar `<PropertyForm t={mockT} />` y verificar que
        todos los strings del mock aparecen en el output.
      - Test de error: simular selección de archivo con MIME
        inválido y verificar que aparece `PF_ERR_INVALID` (no el
        string en inglés viejo).
      - Test de tamaño: archivo > 5 MB y verificar `PF_ERR_SIZE`.
      - Test de integración de submit: mockear
        `saveProperty` server action, renderizar y verificar
        que **se llama con el mismo payload que antes**
        (campos `title`, `price`, `type`, `images`, `amenities`,
        `is_featured`, `is_active` en inglés).
      Cubre: **R8**, **R9**, **R10**, **R13**, **R15**.

- [x] **T15** — Crear `tests/app/admin/properties.test.tsx`
      (L3 / integración de page):
      - Mockear `getDictionary` para devolver un dict con
        `properties_list.*` reconocible.
      - Renderizar `<AdminPropertiesPage />` y verificar que
        aparecen los strings traducidos (título, subtítulo, stats,
        badges, paginación, empty si no hay propiedades).
      Cubre: **R14**.

- [x] **T16** — Crear `tests/app/admin/users.test.tsx`
      (L3 / integración de page):
      - Mockear `getDictionary` con `users_list.*` reconocible.
      - Renderizar `<AdminUsersPage />` y verificar título,
        subtítulo, search placeholder, tabs, badges
        Administrator/User/Active, acciones Make/Remove Admin,
        empty si no hay usuarios.
      Cubre: **R14**.

- [x] **T17** — Crear `tests/app/admin/layout.test.tsx` (L3):
      - Mockear sesión con usuario admin y `getDictionary` con
        `layout.*` reconocible.
      - Renderizar `<AdminLayout>` y verificar que el `403` y
        `forbidden_message` se renderizan desde el dict cuando
        el usuario no es admin.
      - Verificar que el footer **NO** consume el dict (string
        "Todos los derechos reservados" debe seguir presente tal
        cual, sin pasar por `t.*`).
      Cubre: **R6**, **R17**.

- [x] **T18** — Test de paridad de keys entre los 3 diccionarios
      (puede ir en `tests/i18n/parity.test.ts` o como assertion
      en cada test de page). Verificar programáticamente que
      `Object.keys(es.dashboard)` ≡ `Object.keys(en.dashboard)` ≡
      `Object.keys(fr.dashboard)` y que las subsecciones tienen
      la misma forma. Cubre: **R2**.

---

## Bloque 7 — Verificación final (R11, R12, R15, R18, R19)

- [x] **T19** — Ejecutar `pnpm build` y verificar que termina con
      código 0. Si falla por error de tipo en el dict (key
      faltante en algún locale), volver a T2/T3/T4 hasta que
      compile. Cubre: **R11**.

- [x] **T20** — Ejecutar `pnpm test:run` y verificar que **toda**
      la suite (preexistente + nueva) pasa al 100 %. Cubre: **R12**,
      **R13**, **R14**, **R15**.

- [x] **T21** — En `docs/architecture.md`, sección **i18n — Detalles**:
      - Añadir un párrafo indicando que el panel `/admin/*` también
        consume la sección `dashboard` del `Dictionary`.
      - Listar los archivos del admin que la consumen
        (`app/admin/layout.tsx`, `app/admin/properties/page.tsx`,
        `app/admin/properties/create/page.tsx`,
        `app/admin/properties/[id]/edit/page.tsx`,
        `app/admin/users/page.tsx`, `components/admin/AdminNav.tsx`,
        `components/admin/PropertyForm.tsx`).
      Cubre: **R18**.

- [x] **T22** — Crear/actualizar `progress/impl_admin-i18n.md` con
      el mapa de trazabilidad `R<n> → <test-path>::<test-name>`
      para **todos** los R1–R19. Usar el formato del ejemplo de
      `docs/specs.md` §Trazabilidad. Cubre: **R19**.

- [x] **T23** — Verificación manual end-to-end (opcional pero
      recomendada): correr `pnpm dev`, hacer login admin, navegar
      `/admin`, `/admin/properties`, `/admin/properties/create`,
      `/admin/users`. Cambiar locale con `LanguageSelector` y
      verificar que el admin se traduce en su totalidad en los 3
      idiomas. Documentar cualquier desviación.
      T23 verified by reviewer.

---

## Resumen de cobertura R ↔ T

| R | Tasks que lo cubren |
|---|---------------------|
| R1 | T1 |
| R2 | T2, T3, T4, T18 |
| R3 | T6, T7, T8, T9, T10, T11 |
| R4 | T2 |
| R5 | T3, T4 |
| R6 | T5, T7, T8, T9, T11, T17 |
| R7 | T5, T6, T13 |
| R8 | T8, T9, T10, T14 |
| R9 | T10, T14 |
| R10 | T10, T14 |
| R11 | T19 |
| R12 | T12, T20 |
| R13 | T13, T14 |
| R14 | T15, T16 |
| R15 | T10, T14, T20 |
| R16 | T10 |
| R17 | T5, T6, T17 |
| R18 | T21 |
| R19 | T22 |

> Cobertura completa: cada R tiene al menos una task. Cada task
> referencia al menos un R.
