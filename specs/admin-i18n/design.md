# Design — `admin-i18n`

> Decisiones técnicas para implementar `specs/admin-i18n/requirements.md`.
> Apoyado en `docs/architecture.md` §i18n — Detalles, §Clean Architecture
> Layers y `docs/conventions.md`.

---

## 1. Forma de la nueva sección `dashboard` en `Dictionary`

Se añade una nueva `DashboardDict` interface en `types/i18n.ts` y un
campo `dashboard: DashboardDict` en `Dictionary`. La forma propuesta
(se ajusta al redactar — R1 marca el mínimo):

```ts
// types/i18n.ts (extracto)
export interface DashboardNavDict {
  dashboard: string;        // "Dashboard" | "Tableau de bord"
  properties: string;       // "Properties" | "Propiedades" | "Propriétés"
  users: string;            // "Users"     | "Usuarios"    | "Utilisateurs"
  administrator: string;    // label bajo el avatar en AdminNav
  // logout NO se mueve — ver R17 / §6
}

export interface DashboardLayoutDict {
  forbidden_title: string;          // "403"
  forbidden_message: string;        // "You do not have permission..."
  // footer NO se mueve — ver R17 / §6
}

export interface DashboardPropertiesListDict {
  title: string;            // "My Properties" | "Mis Propiedades" | "Mes Propriétés"
  subtitle: string;
  add_new_property: string;
  stats: {
    total_listings: string;
    active_listings: string;
    inactive_listings: string;
  };
  table: {
    property_details: string;
    price: string;
    status: string;
    actions: string;
  };
  badges: {
    active: string;
    inactive: string;
    featured: string;
  };
  titles: {
    edit_property: string;
    activate_property: string;
    deactivate_property: string;
  };
  empty: string;            // "No properties found."
  pagination: {
    showing: string;        // "Showing {from} to {to} of {total} results"
  };
}

export interface DashboardPropertyFormDict {
  breadcrumb: {
    properties: string;
    add_new: string;
    edit: string;           // "Edit {title}" — el componente inyecta title
  };
  basic_information: string;
  description_title: string;
  gallery: string;
  location: string;
  details: string;
  amenities_title: string;
  featured: string;
  active: string;
  inactive: string;
  property_title: string;
  price: string;
  property_type: string;
  address: string;
  latitude: string;
  longitude: string;
  map_location: string;     // chip sobre el placeholder del mapa
  year_built: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  file_formats: string;     // "JPG, PNG, WEBP" (chip en header de Gallery)
  drop_zone: string;        // "Click or drag images here"
  max_size: string;         // "Max file size 5MB per image"
  uploading: string;        // "Uploading..."
  main: string;             // chip "Main" en la primera imagen
  cancel: string;
  save: string;             // botón mobile
  save_property: string;    // botón desktop
  character_counter: string;// "{count} / 2000 characters"
  amenities_list: Record<string, string>; // key EN persistida → label traducido
  errors: {
    invalid_file_type: string;   // "Invalid file type \"{name}\". Accepted: ..."
    file_exceeds_size: string;   // "File \"{name}\" exceeds maximum size of 5MB."
    failed_to_optimize: string;  // fallback genérico
    failed_to_upload: string;
    failed_to_save: string;
  };
}

export interface DashboardUsersListDict {
  title: string;            // "User Directory"
  subtitle: string;
  search_placeholder: string;
  add_user: string;
  tabs: {
    all: string;            // "Todos los Usuarios" (es)
    agents: string;
    brokers: string;
    admins: string;
  };
  table: {
    user_details: string;
    role_status: string;
    performance: string;
    actions: string;
  };
  badges: {
    administrator: string;
    user: string;
    active: string;
  };
  performance: {
    properties: string;
    access_level: string;
  };
  actions: {
    make_admin: string;
    remove_admin: string;
  };
  empty: string;            // "No users found."
  pagination: {
    showing: string;
  };
}

export interface DashboardCommonDict {
  // Reusable fragments across dashboard pages.
  required: string;         // marcador "*" — mensaje de "campos obligatorios"
  fields_mandatory: string; // sufijo de las descripciones create/edit: "Fields marked with * are mandatory."
  page_title_create: string;
  page_subtitle_create: string;
  page_title_edit: string;
  page_subtitle_edit: string;
  forbidden_title: string;  // "403" duplicado aquí para tests sin layout
  forbidden_message: string;
}

export interface DashboardErrorsDict {
  // Errores genéricos del dashboard que NO son del PropertyForm.
  save_failed: string;      // "Failed to save property." (lo lanza saveProperty)
  upload_failed: string;    // "Failed to upload image to Cloudinary."
  invalid_file_type: string;
  file_exceeds_size: string;
  no_file: string;          // "No file provided."
}

export interface DashboardDict {
  nav: DashboardNavDict;
  layout: DashboardLayoutDict;
  properties_list: DashboardPropertiesListDict;
  property_form: DashboardPropertyFormDict;
  users_list: DashboardUsersListDict;
  common: DashboardCommonDict;
  errors: DashboardErrorsDict;
}
```

**Por qué así y no aplanado** — sigue el patrón del `Dictionary`
existente: cada subsección es un objeto con tipos `string` (y
`Record<...>` para maps como `amenities_list`). Mantiene trazabilidad
con la estructura del JSX y permite importar tipos específicos
(`DashboardPropertyFormDict`) en tests o componentes.

---

## 2. Cómo los server components leen el locale

Se replica **exactamente** el patrón usado en `app/page.tsx`,
`app/properties/[slug]/page.tsx`, etc.:

```ts
// app/admin/layout.tsx
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es';
  const t = getDictionary(locale).dashboard;
  // ...auth check, then:
  return (
    <div>
      <AdminNav user={session.user} t={t.nav} />
      <div>{children}</div>
      <footer>... {/* footer no se traduce (R17) */}</footer>
    </div>
  );
}
```

Cada page server component hace lo mismo y pasa **solo la subsección
que necesita** al client component hijo:

```ts
// app/admin/properties/page.tsx
const t = getDictionary(locale).dashboard;
// ...
return <main>...{t.properties_list.title}...</main>;
```

```ts
// app/admin/properties/create/page.tsx
const t = getDictionary(locale).dashboard.property_form;
// ...
<PropertyForm t={t} />
```

```ts
// app/admin/properties/[id]/edit/page.tsx (igual + initialData)
const t = getDictionary(locale).dashboard.property_form;
// ...
<PropertyForm t={t} initialData={property} />
```

```ts
// app/admin/users/page.tsx
const t = getDictionary(locale).dashboard.users_list;
// ...
```

> El cookie `NEXT_LOCALE` se setea vía
> `components/LanguageSelector.tsx` (existente, ver `docs/architecture.md`
> §i18n — Detalles) y por defecto vale `'es'`.

---

## 3. Cómo se pasa el dict a client components (prop, no Context)

**Decisión**: prop directa desde el server component padre.

```tsx
// Antes (client component, sin dict):
<PropertyForm initialData={property} />

// Después (client component, con dict):
<PropertyForm t={t} initialData={property} />
```

```tsx
// components/admin/PropertyForm.tsx (extracto)
'use client';
import type { DashboardPropertyFormDict } from '@/types/i18n';

interface PropertyFormProps {
  initialData?: Property;
  t: DashboardPropertyFormDict;
}

export default function PropertyForm({ initialData, t }: PropertyFormProps) {
  // uso: t.basic_information, t.errors.invalid_file_type, etc.
}
```

```tsx
// components/admin/AdminNav.tsx (extracto)
'use client';
import type { DashboardNavDict } from '@/types/i18n';

interface AdminNavProps {
  user: AdminNavUser;
  t: DashboardNavDict;
}

export default function AdminNav({ user, t }: AdminNavProps) {
  // uso: t.dashboard, t.properties, t.users, t.administrator
}
```

**Por qué prop y no Context React** — la feature #8 misma lo dice en
`decisions` del `feature_list.json`: *"PropertyForm recibe el dict via
prop (ya es client component); no se introduce un Context nuevo para
no inflar el bundle del admin."* Además, el árbol del admin es chico
(layout → page → PropertyForm) y un Context sumaría un provider, un
hook, más una capa de hidratación sin beneficio. Mantener el patrón
**idéntico al de las páginas públicas** (`Hero` recibe
`dict.hero`/`commonDict`/`filtersDict` por prop, ver `app/page.tsx`
líneas 71–72) es lo más consistente.

---

## 4. Errores de PropertyForm: traducir en cliente, no en server action

**Decisión**: los mensajes de error que `PropertyForm` muestra se
**construyen en el cliente** a partir del dict `t.errors.*`. La server
action `uploadImage`/`saveProperty` sigue tirando `new Error("Failed
to upload image to Cloudinary.")` con mensaje en inglés (capa de
adaptador, no debe traducir — eso es i18n del lado de UI, no del lado
de servidor). `PropertyForm` mapea esos mensajes crudos con un
`try/catch` que cae al `t.errors.failed_to_upload` (R15).

```tsx
// components/admin/PropertyForm.tsx (extracto)
try {
  optimizedBlob = await optimizeImage(file);
} catch (err) {
  setError(
    err instanceof Error && err.message
      ? err.message
      : t.errors.failed_to_optimize,
  );
  continue;
}
```

**Por qué no traducir en la server action** — la server action es
capa de adaptador (`app/admin/properties/actions.ts`); su contrato de
error es para developers, no para UI. Si mañana hay un cliente CLI
o un script invocando `uploadImage`, los mensajes en inglés son
utilizables. La UI es responsable de traducir lo que muestra al
usuario final.

> Esta es la `open_questions[0]` del `feature_list.json` — el humano
> lo confirma. Mientras tanto el spec asume esta decisión.

---

## 5. Amenities: keys persistidas, labels traducidos (R16)

**Decisión**: `AMENITIES_LIST` se queda con las 8 keys en inglés
exactamente como hoy:

```ts
const AMENITIES_LIST = [
  'Swimming Pool', 'Garden', 'Air Conditioning', 'Smart Home',
  'Balcony', 'Gym', 'Security System', 'Elevator',
] as const;
```

Estas keys son las que se persisten en `properties.amenities[]` (DB
Neon, columna `text[]`). El UI se traduce leyendo el dict:

```tsx
<label>
  <input
    type="checkbox"
    checked={(formData.amenities || []).includes(amenity)}
    onChange={() => handleAmenityToggle(amenity)}
  />
  <span>{t.amenities_list[amenity] ?? amenity}</span>
</label>
```

Donde el dict tiene:

```json
"property_form": {
  "amenities_list": {
    "Swimming Pool": "Piscina",
    "Garden": "Jardín",
    ...
  }
}
```

**Por qué** — la DB ya tiene datos con keys en inglés. Cambiar las
keys a IDs estables (`pool`, `garden`, ...) implicaría una migración
de datos que está **explícitamente fuera de scope** (ver
`out_of_scope` de la feature). La etiqueta traducida es lo que ve el
usuario; la key persistida es lo que el sistema usa para filtrar,
buscar y mostrar en otros lugares (ej. detalle de propiedad, que
también consume `property_detail.amenity_labels` ya existente).

> Esta es la `open_questions[1]` del `feature_list.json` — el humano
> lo confirma. Mientras tanto el spec asume esta decisión.

---

## 6. Strings que NO se migran (R3, R17)

- **Footer del admin** (en `app/admin/layout.tsx`):
  `"© {year} LuxeEstate Properties. Todos los derechos reservados."`
  — ya está en español y la feature lo declara explícitamente fuera
  de scope.
- **`"Cerrar sesión"`** en `AdminNav` — ya en español, queda igual.
- **`'sale'` / `'rent'`** como `value` del `<select>` de tipo de
  propiedad — son valores del enum `property_type` persistido en DB,
  no copy traducible (R3 los excluye explícitamente).
- **Nombres de campos en inputs** (`id="title"`, `id="price"`, etc.)
  y `name` de inputs hidden en forms de server actions — son parte
  del contrato con la server action (R10), no se renombran.

---

## 7. Archivos a crear / modificar

### Modificar (sin crear nada nuevo salvo los 3 specs)

| Archivo | Cambio |
|---------|--------|
| `types/i18n.ts` | Añadir `DashboardDict` y subinterfaces; añadir `dashboard: DashboardDict` a `Dictionary`. |
| `data/dictionaries/es.json` | Añadir objeto `dashboard` completo. |
| `data/dictionaries/en.json` | Añadir objeto `dashboard` completo. |
| `data/dictionaries/fr.json` | Añadir objeto `dashboard` completo. |
| `app/admin/layout.tsx` | Leer cookie + `getDictionary`; pasar `t.nav` a `AdminNav`; traducir 403/permission con `t.layout`. |
| `app/admin/properties/page.tsx` | Leer cookie + dict; traducir header, stats, tabla, badges, titles, empty, paginación. |
| `app/admin/properties/create/page.tsx` | Leer cookie + dict; traducir breadcrumb, título, subtítulo; pasar `t` a `PropertyForm`. |
| `app/admin/properties/[id]/edit/page.tsx` | Idem create + pasar `initialData` y `t`. |
| `app/admin/users/page.tsx` | Leer cookie + dict; traducir header, search, tabs, tabla, badges, performance, actions, empty, paginación. |
| `components/admin/AdminNav.tsx` | Añadir prop `t: DashboardNavDict`; reemplazar strings `Dashboard`, `Properties`, `Users`, `Administrator` con `t.*`. |
| `components/admin/PropertyForm.tsx` | Añadir prop `t: DashboardPropertyFormDict`; reemplazar todos los strings listados en R3; traducir errores con `t.errors.*`. |
| `docs/architecture.md` | Sección **i18n — Detalles**: añadir párrafo mencionando que `/admin/*` consume `dashboard` del `Dictionary` y listar archivos. |

### Crear (spec — ya hecho en este turno)

| Archivo | Estado |
|---------|--------|
| `specs/admin-i18n/requirements.md` | ✅ creado |
| `specs/admin-i18n/design.md` | ✅ este archivo |
| `specs/admin-i18n/tasks.md` | ✅ creado |

> El implementer NO crea archivos de spec, solo los 3 anteriores ya
> están. NO toca `lib/i18n.ts` (la función `getDictionary` ya
> existe y es la correcta).

---

## 8. Excepciones / manejo de fallos

- **Cookie corrupta** (`NEXT_LOCALE=zz`): `getDictionary()` ya hace
  fallback a `dictionaries['en']` (línea 11 de `lib/i18n.ts`). El
  admin se renderiza en inglés — comportamiento actual, no cambia.
- **Dict parcial**: si una key falta en `es/en/fr.json`, TypeScript
  marca error de tipo en build (R11). El reviewer exige las 3
  traducciones presentes.
- **`'use server'` en `actions.ts`**: no se toca. La server action
  sigue tirando errores en inglés como contrato de programador; el
  cliente los mapea al dict.

---

## 9. Alternativas descartadas

### 9.1 Context React para el dict del admin

**Descartada.** Aunque un `<I18nProvider value={t}>` con un
`useDashboardDict()` hook permitiría que cualquier client component
profundo consuma el dict sin prop drilling, el árbol del admin es
**muy chico** (Layout → Nav + page → form). Un Context suma:
- Provider en `AdminLayout` (un `React.createContext` + `useMemo`).
- Hook `useDashboardDict()` (un archivo + 1 export).
- Re-render en cualquier cambio de `t` (que en este caso es por
  cookie — no cambia intra-render).
- Bundle mayor.

El patrón de **prop directa** es lo que ya usan `Hero`,
`FeaturedCollection`, `NewInMarket` (`app/page.tsx` líneas 71–81) y
mantiene cero magia. La feature #8 misma lo declara en `decisions`
del `feature_list.json`.

### 9.2 Traducir errores en la server action

**Descartada** (ver §4). La server action es un adaptador — sus
mensajes son para developers. Traducirlos obliga a la server action
a recibir el locale, y eso acopla capa de adaptador con i18n de UI.
Es responsabilidad de `PropertyForm` mapear.

### 9.3 Cambiar las keys de `AMENITIES_LIST` a IDs estables

**Descartada** (ver §5). Implica migración de datos
`properties.amenities[]` en Neon, que está **fuera de scope**. La
feature explícitamente solo toca UI, no DB. La solución intermedia
(label traducido + key persistida) cubre el caso sin migración.

### 9.4 Mover el `LanguageSelector` al admin

**Descartada** (fuera de scope — la feature no menciona esto y el
admin ya hereda el `LanguageSelector` si está en el root layout o
en el `Navbar` público; el `AdminNav` es un navbar separado y propio
del admin).

---

## 10. Resumen de decisiones

| # | Decisión | Justificación |
|---|----------|---------------|
| D1 | `DashboardDict` interface en `types/i18n.ts` con 7 subsecciones | Trazabilidad con la estructura del JSX + tipado estricto. |
| D2 | Server components leen cookie `NEXT_LOCALE` con `cookies()` y `getDictionary()` | Patrón idéntico al resto de la app (5 archivos ya lo usan). |
| D3 | Client components reciben dict **por prop**, no Context | Árbol chico + consistencia con `Hero`/`FeaturedCollection`/`NewInMarket` + decisión de la feature. |
| D4 | Errores se traducen en el cliente, no en la server action | Capa de adaptador no debe acoplarse a i18n de UI. |
| D5 | `AMENITIES_LIST` mantiene keys en inglés persistidas + label traducido del dict | Sin migración de datos; compatibilidad con DB existente. |
| D6 | Footer y "Cerrar sesión" NO se mueven al dict | Ya en español, fuera de scope explícito. |
| D7 | `docs/architecture.md` actualizado en sección i18n — Detalles | Acceptance criterion R18. |
