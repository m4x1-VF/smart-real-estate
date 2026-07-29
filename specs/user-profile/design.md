# user-profile — Design

> Feature #6 — Decisiones técnicas para el perfil de usuario.

## 1. Archivos a crear

| Archivo | Capa | Responsabilidad |
|---------|------|-----------------|
| `app/profile/page.tsx` | Externa | Server Component. Auth gate (redirect si no hay sesión). Obtiene datos del usuario vía `auth.api.getSession()` y renderiza `ProfileForm`. |
| `app/profile/actions.ts` | Casos de Uso | Server Actions: `updateProfile`, `changePassword`, `uploadAvatar`. Todas verifican sesión activa. |
| `lib/auth/profile-schemas.ts` | Adaptadores | Schemas Zod: `updateProfileSchema`, `changePasswordSchema`. Tipos inferidos: `UpdateProfileInput`, `ChangePasswordInput`. |
| `components/ProfileForm.tsx` | Externa | Client Component. Formulario con tres secciones: datos personales, avatar, cambio de contraseña. |
| `tests/unit/profile-actions.test.ts` | Tests | Tests L2 de las server actions (`updateProfile`, `changePassword`, `uploadAvatar`). |
| `tests/unit/profile-form.test.ts` | Tests | Tests L3 del componente `ProfileForm` (si React Testing Library está disponible; si no, tests de integración de las acciones). |

## 2. Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `middleware.ts` | Agregar `/profile` a las rutas protegidas: si no hay cookie de sesión y la ruta es `/profile`, redirigir a `/login`. |
| `lib/cloudinary.ts` | Añadir parámetro opcional `options?: { folder?: string }` a `uploadImageToCloudinary` para permitir subir a `luxu-estate/avatars/` (default sigue siendo `luxu-estate/properties/`). |
| `components/Navbar.tsx` | Añadir link al avatar: envolver el botón del avatar en un `<Link href="/profile">` para que al hacer click navegue al perfil. |
| `docs/architecture.md` | Documentar la página `/profile`, las server actions de perfil, y la extensión de `uploadImageToCloudinary` con folder configurable. |

## 3. Schema de base de datos

**Sin cambios.** La tabla `user` de better-auth ya tiene las columnas necesarias:

| Columna | Uso en esta feature |
|---------|---------------------|
| `name` | Editable por el usuario vía `updateProfile` |
| `email` | Solo lectura (mostrar en formulario) |
| `image` | URL del avatar, actualizada por `uploadAvatar` |

No se crea una tabla `profile` separada. better-auth provee las APIs para actualizar estos campos directamente.

## 4. Firmas nuevas

### `app/profile/actions.ts`

```typescript
'use server';

/**
 * Actualiza el nombre del usuario autenticado.
 * Lanza Error si la sesión no existe o si el nombre está vacío.
 */
export async function updateProfile(
  formData: FormData,
): Promise<{ success: true }>;

/**
 * Cambia la contraseña del usuario autenticado.
 * Verifica la contraseña actual antes de aplicar el cambio.
 * Lanza Error si la sesión no existe, si la contraseña actual es incorrecta,
 * o si la nueva contraseña no cumple las reglas de validación.
 */
export async function changePassword(
  formData: FormData,
): Promise<{ success: true }>;

/**
 * Sube un avatar a Cloudinary y actualiza el campo `image` del usuario.
 * Verifica sesión, valida MIME y tamaño, sube a Cloudinary (folder: avatars),
 * y actualiza user.image vía better-auth.
 * Lanza Error en cualquier fallo.
 */
export async function uploadAvatar(
  formData: FormData,
): Promise<{ url: string }>;
```

### `lib/auth/profile-schemas.ts`

```typescript
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

### `lib/cloudinary.ts` (modificación)

```typescript
// Firma extendida (backward-compatible)
export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  mimeType: string,
  options?: { folder?: string },
): Promise<string>;
// options.folder default: 'luxu-estate/properties/'
// Si se pasa 'luxu-estate/avatars/', sube a esa carpeta.
```

## 5. Flujo de updateProfile

```
ProfileForm (client)
  → usuario edita nombre, click "Save"
  → validación client-side con updateProfileSchema
  → si falla: setError() y skip
  → invoca updateProfile(formData) — server action
  → server action:
      1. auth.api.getSession() → verifica sesión
      2. Extrae name de formData
      3. auth.api.updateUser({ headers, body: { name } })
      4. revalidatePath('/profile')
      5. Retorna { success: true }
  → ProfileForm: muestra confirmación, actualiza estado local
```

## 6. Flujo de changePassword

```
ProfileForm (client)
  → usuario ingresa currentPassword, newPassword, confirmPassword
  → click "Change Password"
  → validación client-side con changePasswordSchema
  → si falla: setError() y skip
  → invoca changePassword(formData) — server action
  → server action:
      1. auth.api.getSession() → verifica sesión
      2. Extrae currentPassword, newPassword de formData
      3. auth.api.changePassword({ headers, body: { currentPassword, newPassword, revokeOtherSessions: false } })
      4. Si better-auth lanza error (contraseña actual incorrecta): propaga Error
      5. Retorna { success: true }
  → ProfileForm: muestra confirmación, limpia campos de contraseña
```

## 7. Flujo de uploadAvatar

```
ProfileForm (client)
  → usuario selecciona imagen de avatar
  → validación client-side: MIME (jpeg/png/webp/gif), tamaño ≤ 2 MB
  → si falla: setError() y skip
  → optimizeImage(file) → Blob optimizado
  → convierte Blob a File, crea FormData con el File
  → invoca uploadAvatar(formData) — server action
  → server action:
      1. auth.api.getSession() → verifica sesión
      2. Extrae File de formData.get('file')
      3. Valida MIME y tamaño server-side
      4. Convierte File a Buffer
      5. uploadImageToCloudinary(buffer, mimeType, { folder: 'luxu-estate/avatars/' })
      6. auth.api.updateUser({ headers, body: { image: secure_url } })
      7. revalidatePath('/profile')
      8. Retorna { url: secure_url }
  → ProfileForm: actualiza preview del avatar con la nueva URL
```

## 8. Componente ProfileForm

```
components/ProfileForm.tsx
  ├── Sección "Personal Info"
  │   ├── Campo nombre (input text, editable)
  │   ├── Campo email (input text, readonly/disabled)
  │   └── Botón "Save Changes" → updateProfile
  ├── Sección "Avatar"
  │   ├── Preview circular del avatar actual (next/image)
  │   ├── Input file (hidden, triggered by button click)
  │   ├── Botón "Change Avatar" → trigger file input
  │   └── Spinner durante upload
  └── Sección "Change Password"
      ├── Campo current password (input password)
      ├── Campo new password (input password)
      ├── Campo confirm password (input password)
      └── Botón "Change Password" → changePassword
```

Props del componente:

```typescript
interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}
```

## 9. Excepciones y errores

| Escenario | Error lanzado | Manejo en ProfileForm |
|-----------|---------------|----------------------|
| Sesión no autenticada | `Error('Not authenticated')` | Redirect a `/login` (middleware lo hace) |
| Nombre vacío | `Error('Name is required')` | Banner rojo en sección Personal Info |
| Contraseña actual incorrecta | `Error('Current password is incorrect')` | Banner rojo en sección Change Password |
| Nueva contraseña < 8 chars | Validación Zod client-side | Mensaje inline bajo el campo |
| Passwords no coinciden | Validación Zod client-side | Mensaje inline bajo confirmPassword |
| MIME inválido (avatar) | `Error('Invalid file type. Accepted: JPEG, PNG, WEBP, GIF.')` | Banner rojo en sección Avatar |
| Tamaño > 2 MB (avatar) | `Error('File exceeds maximum size of 2MB.')` | Banner rojo en sección Avatar |
| Cloudinary API error | `Error('Failed to upload avatar.')` | Banner rojo en sección Avatar |

## 10. Límites de avatar vs. propiedades

| Aspecto | Propiedades | Avatar |
|---------|-------------|--------|
| Tamaño máximo | 5 MB | 2 MB |
| Max dimensión (optimizeImage) | 1920px | 1920px (reutiliza misma función) |
| Calidad JPEG | 85% | 85% (reutiliza misma función) |
| Carpeta Cloudinary | `luxu-estate/properties/` | `luxu-estate/avatars/` |
| MIME permitidos | jpeg, png, webp, gif | jpeg, png, webp, gif |

**Justificación del límite de 2 MB**: Los avatares se muestran a 36×36px en el Navbar y ~120×120px en /profile. Un archivo de 2 MB es generoso para este caso de uso. La optimización client-side reducirá el tamaño real enviado a ~100-300 KB.

## 11. Alternativa descartada

### Tabla `profile` separada

**Opción**: Crear una tabla `profile` con columnas `user_id`, `bio`, `phone`, `avatar_url` y una FK hacia `user.id`.

**Por qué se descarta**:
- La tabla `user` de better-auth ya tiene `name`, `email` e `image` — los únicos campos que esta feature necesita.
- El scope excluye explícitamente campos adicionales (bio, teléfono).
- Una tabla separada añade complejidad: JOINs, sincronización, migración adicional.
- better-auth provee `auth.api.updateUser()` para modificar `name` e `image` directamente — no hay necesidad de queries SQL manuales.
- Si en el futuro se necesitan campos adicionales, se puede crear la tabla `profile` en ese momento sin migración de datos existente.

### Usar `authClient` en vez de server actions

**Opción**: Usar `authClient.updateUser()` y `authClient.changePassword()` directamente desde el Client Component, sin server actions.

**Por qué se descarta**:
- El avatar necesita server action de todos modos (upload a Cloudinary con API secret).
- Las server actions permiten validación server-side consistente con el patrón de admin.
- Los tests L2 requieren server actions testeables (no se puede testear `authClient` sin un browser).
- El patrón del proyecto es server actions para mutaciones (ver `app/admin/properties/actions.ts`).

## 12. Decisiones de diseño

- **Sin cambios de schema**: La tabla `user` de better-auth ya tiene todo lo necesario.
- **Avatar en Navbar**: Ya implementado. El Navbar lee `user.image` vía `auth.api.getSession()`. Solo se añade un `<Link>` para navegar a `/profile` al hacer click en el avatar.
- **Tres server actions separadas**: `updateProfile`, `changePassword`, `uploadAvatar`. Cada una tiene una responsabilidad clara y es testeable de forma independiente.
- **Carpeta Cloudinary separada**: `luxu-estate/avatars/` para organizar los avatares separados de las imágenes de propiedades.
- **Límite de avatar: 2 MB**: Suficiente para fotos de perfil, menor que el de propiedades (5 MB) porque los avatares son imágenes más pequeñas.
- **`revokeOtherSessions: false`**: Al cambiar contraseña, no se revocan otras sesiones. El usuario puede estar logueado en múltiples dispositivos y no queremos desconectarlos todos.

## 13. Respuestas a Open Questions

### OQ1: ¿El avatar tiene un tamaño máximo diferente al de las imágenes de propiedades?

**Sí: 2 MB** (vs 5 MB de propiedades). Los avatares se muestran a tamaños pequeños (36×36px en Navbar, ~120×120px en /profile). 2 MB es más que suficiente para una foto de perfil, y el `optimizeImage` client-side reducirá el tamaño real a ~100-300 KB.

### OQ2: ¿Se muestra el avatar en el header/navbar o solo en /profile?

**En ambos.** El Navbar ya muestra `user.image` con fallback a iniciales SVG (ver `components/Navbar.tsx` línea 86). Esta feature solo añade un `<Link href="/profile">` alrededor del avatar del Navbar para que sea clickeable.
