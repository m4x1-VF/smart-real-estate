# user-profile — Tasks

> Feature #6 — Checklist ejecutable. El implementer marca `[x]` al completar.
> Cada task referencia los `R<n>` que cubre.

## Middleware

- [x] T1 — Modificar `middleware.ts`: agregar `/profile` a las rutas protegidas. Si no hay cookie de sesión y la ruta empieza con `/profile`, redirigir a `/login`. Cubre: R1.

## Schemas de validación

- [x] T2 — Crear `lib/auth/profile-schemas.ts` con `updateProfileSchema` (name: min 1) y `changePasswordSchema` (currentPassword: min 1, newPassword: min 8, confirmPassword: refine match). Exportar tipos `UpdateProfileInput` y `ChangePasswordInput`. Cubre: R4, R13, R14.

## Adaptador Cloudinary

- [x] T3 — Modificar `lib/cloudinary.ts`: añadir parámetro opcional `options?: { folder?: string }` a `uploadImageToCloudinary`. Default: `'luxu-estate/properties/'`. Si se pasa `folder`, usarlo en `cld.uploader.upload()`. Cubre: R5.

## Server Actions

- [x] T4 — Crear `app/profile/actions.ts` con server action `updateProfile(formData)`: verificar sesión con `auth.api.getSession()`, extraer `name`, validar con `updateProfileSchema`, llamar `auth.api.updateUser({ headers, body: { name } })`, `revalidatePath('/profile')`, retornar `{ success: true }`. Cubre: R3, R4.
- [x] T5 — Añadir server action `changePassword(formData)` en `app/profile/actions.ts`: verificar sesión, extraer `currentPassword` y `newPassword`, validar con `changePasswordSchema`, llamar `auth.api.changePassword({ headers, body: { currentPassword, newPassword, revokeOtherSessions: false } })`, propagar error si contraseña actual es incorrecta, retornar `{ success: true }`. Cubre: R11, R12, R13, R14.
- [x] T6 — Añadir server action `uploadAvatar(formData)` en `app/profile/actions.ts`: verificar sesión, extraer `File`, validar MIME (jpeg/png/webp/gif) y tamaño (≤ 2 MB), convertir a Buffer, llamar `uploadImageToCloudinary(buffer, mimeType, { folder: 'luxu-estate/avatars/' })`, actualizar `user.image` vía `auth.api.updateUser({ headers, body: { image: url } })`, `revalidatePath('/profile')`, retornar `{ url }`. Cubre: R5, R6, R7, R8, R15.

## Página /profile

- [x] T7 — Crear `app/profile/page.tsx` (Server Component): obtener sesión con `auth.api.getSession()`, redirect a `/login` si no hay sesión, pasar datos del usuario (`name`, `email`, `image`) como props a `ProfileForm`. Cubre: R1, R2.

## Componente ProfileForm

- [x] T8 — Crear `components/ProfileForm.tsx` (Client Component): recibir props `user: { name, email, image }`. Sección "Personal Info": input nombre (editable), input email (disabled/readonly), botón "Save Changes" que invoca `updateProfile`. Manejo de errores con banner y estado `isLoading`. Cubre: R2, R3, R4.
- [x] T9 — Añadir sección "Avatar" en `ProfileForm`: preview circular con `next/image` (src: `user.image` o fallback iniciales), input file hidden, botón "Change Avatar" que trigger el file input. Al seleccionar archivo: validar MIME y tamaño client-side, optimizar con `optimizeImage()`, crear FormData, invocar `uploadAvatar`, actualizar preview con URL retornada. Mostrar spinner durante upload. Cubre: R5, R7, R8, R9, R10, R15.
- [x] T10 — Añadir sección "Change Password" en `ProfileForm`: campos currentPassword, newPassword, confirmPassword (todos type password), botón "Change Password" que invoca `changePassword`. Validación client-side con `changePasswordSchema`. Limpiar campos tras éxito. Manejo de errores con banner. Cubre: R11, R12, R13, R14.

## Navbar

- [x] T11 — Modificar `components/Navbar.tsx`: envolver el botón del avatar en un `<Link href="/profile">` para que al hacer click navegue al perfil. Cubre: R10.

## Tests

- [x] T12 — Crear `tests/unit/profile-actions.test.ts` con tests L2: (a) `updateProfile` exitoso actualiza nombre, (b) `updateProfile` con nombre vacío lanza error, (c) `updateProfile` sin sesión lanza error, (d) `changePassword` exitoso, (e) `changePassword` con contraseña actual incorrecta lanza error, (f) `changePassword` con nueva contraseña < 8 chars lanza error, (g) `uploadAvatar` exitoso retorna URL, (h) `uploadAvatar` con MIME inválido lanza error, (i) `uploadAvatar` con tamaño > 2 MB lanza error, (j) `uploadAvatar` sin sesión lanza error. Cubre: R16.
- [x] T13 — Crear `tests/unit/profile-form.test.ts` con tests L3 del componente `ProfileForm` (o tests de integración si RTL no está disponible): (a) renderiza datos del usuario, (b) envío de actualización de nombre, (c) envío de cambio de contraseña, (d) manejo de errores visibles. Cubre: R17.

## Trazabilidad

- [x] T14 — Documentar trazabilidad R↔test en `progress/impl_user-profile.md`: mapear cada R<n> a su(s) test(s) correspondiente(s). Cubre: R18.

## Documentación

- [x] T15 — Actualizar `docs/architecture.md`: documentar la página `/profile`, las server actions de perfil (`updateProfile`, `changePassword`, `uploadAvatar`), y la extensión de `uploadImageToCloudinary` con folder configurable. Cubre: R18.
