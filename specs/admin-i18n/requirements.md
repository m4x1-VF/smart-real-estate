# Requirements — `admin-i18n`

> Feature #8 — Internacionalización del panel de administración (`/admin/*`).
> EARS estricto. Cada `R<n>` es verificable por al menos un test concreto.

## Contexto

El sistema i18n existente cubre la parte pública (home, detalle, guardado,
filtros, navbar público) pero deja **todo el admin en inglés hardcodeado
dentro del JSX**. Esta feature extiende el sistema i18n con una nueva
sección `dashboard` en `Dictionary` y migra los strings visibles al
usuario de `app/admin/**` y `components/admin/**` a los 3 diccionarios
existentes (`es` / `en` / `fr`).

**Patrón existente que se reutiliza** (ver `app/page.tsx` líneas 27–29 y
`docs/architecture.md` §i18n — Detalles):

```ts
const cookieStore = await cookies();
const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es';
const dict = getDictionary(locale);
```

`defaultLang = 'es'`, locales soportados: `es` / `en` / `fr`.

---

## R1 — Extensión del tipo `Dictionary`

El sistema DEBE extender el tipo `Dictionary` en `types/i18n.ts` con una
nueva sección `dashboard` cuyas subsecciones cubren, como mínimo:
`nav`, `layout`, `properties_list`, `property_form`, `users_list`,
`common`, `errors`.

## R2 — Paridad de keys en los 3 diccionarios

Los 3 archivos `data/dictionaries/{es,en,fr}.json` DEBEN contener la
sección `dashboard` con exactamente las mismas keys (misma forma de
objeto) en los 3 idiomas. CUANDO una key existe en un locale, los otros
dos DEBEN tener esa misma key (puede tener el mismo valor traducido o
idéntico si el concepto no se traduce, p. ej. un valor numérico).

## R3 — Cero strings visibles hardcodeados en el admin

`app/admin/**` y `components/admin/**` NO DEBEN contener strings en
inglés hardcodeados visibles al usuario final. Quedan **excluidos**
(por diseño — son nombres técnicos persistidos en DB o nombres de
clases/atributos):

- `id` / `name` / `type` / `value` / `placeholder` de inputs HTML
  cuando su valor es un nombre de campo persistido (`title`, `price`,
  `type`, `location`, `lat`, `lng`, `beds`, `baths`, `parking`, `sqft`,
  `year_built`, `images`, `amenities`, `is_featured`, `is_active`).
- `value` literal `'sale'` / `'rent'` del `<select>` de `PropertyForm`
  (es el valor del enum `property_type` persistido en DB).
- Keys internas de `AMENITIES_LIST` (cubierto por R18: se traducen en
  UI; las keys persisten tal cual en `properties.amenities[]`).
- Etiquetas `material-icons` y nombres de clases Tailwind/CSS.
- `alt` text de imágenes placeholder cuyo contenido describe la imagen
  (no es copy traducible).

## R4 — Default locale `es` renderiza admin en español

CUANDO la cookie `NEXT_LOCALE` no está seteada o vale `'es'`, el admin
DEBE renderizar todos los textos visibles al usuario en español
(títulos, subtítulos, stats, badges `Active`/`Inactive`/`Featured`,
paginación, tabs, search placeholder, labels de formulario, errores).

## R5 — Cambio de locale traduce el admin completo

CUANDO el usuario cambia el locale a `'en'` o `'fr'` desde
`LanguageSelector` (que setea la cookie `NEXT_LOCALE`), el admin DEBE
traducirse de forma consistente en todos los strings visibles
(Layout 403, AdminNav, listado de propiedades, crear/editar
propiedad, listado de usuarios, errores de formulario).

## R6 — Server components del admin leen locale y obtienen dict

Los siguientes server components DEBEN leer la cookie `NEXT_LOCALE` y
obtener el dict con `getDictionary(locale)` antes de renderizar:

- `app/admin/layout.tsx` (AdminLayout)
- `app/admin/properties/page.tsx` (AdminPropertiesPage)
- `app/admin/properties/create/page.tsx` (CreatePropertyPage)
- `app/admin/properties/[id]/edit/page.tsx` (EditPropertyPage)
- `app/admin/users/page.tsx` (AdminUsersPage)

## R7 — `AdminNav` recibe el dict vía prop

El client component `components/admin/AdminNav.tsx` DEBE recibir el
dict (`dashboard.nav`) como prop desde el server component
`AdminLayout`. NO DEBE leer la cookie `NEXT_LOCALE` por sí mismo.

## R8 — `PropertyForm` recibe el dict vía prop

El client component `components/admin/PropertyForm.tsx` DEBE recibir
el dict (`dashboard.property_form`) como prop desde el server
component padre (`CreatePropertyPage` o `EditPropertyPage`). NO DEBE
leer la cookie `NEXT_LOCALE` por sí mismo.

## R9 — Flujo de upload a Cloudinary intacto

`PropertyForm` NO DEBE romper la lógica de upload a Cloudinary:
optimización vía `optimizeImage()`, validación client-side de MIME y
tamaño, llamada a la server action `uploadImage(formData)`, reemplazo
del placeholder local con el `secure_url` retornado, y tracking de
`uploadingIndices`. Solo cambian los **strings de error y de progreso**
(`"Uploading..."`, mensaje de tipo inválido, etc.) que pasan a venir
del dict.

## R10 — Persistencia intacta vía `saveProperty`

`PropertyForm` NO DEBE romper la persistencia: el payload
`FormData` enviado a la server action `saveProperty` DEBE mantener
los nombres de campos técnicos (`title`, `price`, `type`, `location`,
`lat`, `lng`, `beds`, `baths`, `parking`, `sqft`, `year_built`,
`images`, `amenities`, `is_featured`, `is_active`, `description`,
`id`, `slug`) tal como están hoy. La traducción es solo de copy
visible, no del contrato con la server action.

## R11 — `pnpm build` pasa

`pnpm build` DEBE terminar con código de salida 0 (sin errores de
TypeScript, sin errores de Next.js, sin warnings de i18n).

## R12 — Suite de tests existente sigue verde

`pnpm test:run` (o el script equivalente definido en `package.json`)
DEBE pasar al 100 % sobre los tests preexistentes. Esta feature no
rompe ningún test L1/L2/L3 previo.

## R13 — Tests L3 nuevos para `AdminNav` y `PropertyForm`

DEBEN existir tests L3 (componentes con React Testing Library) que
verifiquen que, dado un dict mockeado, `AdminNav` renderiza las
traducciones de `nav.dashboard`, `nav.properties`, `nav.users`,
`nav.logout` y `PropertyForm` renderiza las traducciones de al menos:
`property_form.basic_information`, `property_form.description`,
`property_form.gallery`, `property_form.location`, `property_form.details`,
`property_form.amenities`, `property_form.cancel`, `property_form.save`.

## R14 — Tests L3 nuevos para páginas de admin

DEBEN existir tests L3 (o, donde no sea práctico, assertions de
integración vía snapshot/data-testid) que verifiquen que
`AdminPropertiesPage`, `CreatePropertyPage`, `EditPropertyPage` y
`AdminUsersPage` renderizan los strings traducidos a partir del dict
obtenido vía `getDictionary(locale)` — en particular:

- `properties_list.title`, `properties_list.subtitle`,
  `properties_list.add_new_property`.
- `properties_list.stats.total_listings`,
  `properties_list.stats.active_listings`,
  `properties_list.stats.inactive_listings`.
- `properties_list.empty` (cuando no hay propiedades).
- `property_form.breadcrumb.properties`,
  `property_form.breadcrumb.add_new`,
  `property_form.breadcrumb.edit` (con placeholder del título).
- `users_list.title`, `users_list.subtitle`,
  `users_list.search_placeholder`, `users_list.add_user`,
  `users_list.tabs.*`, `users_list.empty`.

## R15 — Errores de PropertyForm traducidos

Los strings de error que `PropertyForm` muestra al usuario DEBEN venir
del dict (`dashboard.property_form.errors.*` o
`dashboard.errors.*`) en el locale activo:

- `invalid_file_type` — invalid MIME en validación client-side.
- `file_exceeds_size` — archivo > 5 MB en validación client-side.
- `failed_to_optimize` — fallback de error en `optimizeImage()`.
- `failed_to_upload` — fallback de error en `uploadImage()` server
  action.
- `failed_to_save` — fallback de error en `saveProperty()` server
  action.
- `character_counter` — `"X / 2000 characters"` (con número actual).

## R16 — Amenities con label traducido, key persistida

`PropertyForm` DEBE mostrar las amenidades con su **label traducida**
en el UI, MIENTRAS las keys internas de la lista siguen siendo las
mismas strings en inglés que ya se persisten hoy en
`properties.amenities[]` (columna `text[]` en Neon). Es decir: el
label visible se obtiene del dict (subsección
`property_form.amenities_list`), pero la key que se guarda en el
campo `amenities` del payload al `saveProperty` server action es la
misma string en inglés de hoy (p. ej. `"Swimming Pool"`). Esto evita
romper la compatibilidad con datos ya en la DB.

> Esta decisión se confirma en `design.md` §Decisiones técnicas y la
> confirmación final queda en `open_questions` para que el humano
> ratifique.

## R17 — Footer y strings ya en español no se re-traducen

El footer del admin
(`"© {year} LuxeEstate Properties. Todos los derechos reservados."`)
y el label `"Cerrar sesión"` de `AdminNav` ya están en español; NO
DEBEN moverse al dict — quedan hardcodeados en español como están.

## R18 — `docs/architecture.md` actualizado

`docs/architecture.md` DEBE actualizarse para que la sección
**i18n — Detalles** mencione explícitamente que el panel
`/admin/*` también usa el sistema i18n (cookie `NEXT_LOCALE` +
`getDictionary`) y liste los archivos del admin que consumen la
sección `dashboard` del `Dictionary`.

## R19 — Trazabilidad R↔test documentada

`progress/impl_admin-i18n.md` DEBE contener un mapa explícito
`R<n> → <test-path>::<test-name>` para todos los R1–R18, generado por
el implementer al ejecutar las tasks. El reviewer rechaza si falta
algún mapeo.

---

## Resumen de cobertura

| Acceptance del feature_list.json              | Cubre con   |
|-----------------------------------------------|-------------|
| Sección `dashboard` en `Dictionary`            | R1, R2      |
| Diccionarios es/en/fr con mismas keys          | R2          |
| Cero strings en inglés hardcodeados            | R3          |
| Default `es` muestra todo en español           | R4          |
| Cambio a `en`/`fr` traduce el admin            | R5, R6      |
| Server components leen locale y dict           | R6          |
| Client components reciben dict via prop        | R7, R8      |
| Upload a Cloudinary no se rompe                | R9          |
| Validación y persistencia no se rompen         | R9, R10     |
| `pnpm build` pasa                              | R11         |
| Tests existentes verdes                        | R12         |
| Tests L3 AdminNav y PropertyForm               | R13         |
| Tests L3 páginas admin (dict correcto)         | R14         |
| Errores de PropertyForm traducidos             | R15         |
| `docs/architecture.md` actualizado             | R18         |
| Trazabilidad R↔test documentada                | R19         |
| (extra) Amenities key persistida + label traducido | R16     |
| (extra) Footer y "Cerrar sesión" no se mueven  | R17         |
