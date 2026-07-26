# auth-ui — Design

> Feature #3 — Decisiones técnicas antes de tocar código.
> Complementa `docs/architecture.md` y `docs/conventions.md`.

---

## 1. Decisiones de diseño cerradas

Las open questions de `feature_list.json` se resuelven así:

| Pregunta | Respuesta | Justificación |
|----------|-----------|---------------|
| ¿Passkeys o email/password clásico? | Solo email/password clásico. | Passkeys está fuera de scope (ver `out_of_scope`). |
| ¿Verificación de email obligatoria? | No. Registro directo. | better-auth soporta verificación opcional; se desactiva con `emailAndPassword.requireEmailVerification: false`. Se podrá añadir después sin romper la UI. |
| ¿Zod o validación manual? | **Zod** para validación de formularios. | better-auth ya expone schemas Zod internamente. Usar Zod da tipos inferidos gratis, reuso entre cliente/servidor, y consistencia con el ecosistema. Se añade `zod` como dependencia. |

---

## 2. Archivos a crear

| Archivo | Rol |
|---------|-----|
| `lib/auth/social-providers.ts` | Función pura `buildSocialProviders()` que lee env vars y retorna el objeto `socialProviders` para better-auth. Extraída para testabilidad sin DB. |
| `lib/auth/schemas.ts` | Schemas Zod para login y signup: `loginSchema`, `signupSchema`. Tipos inferidos: `LoginInput`, `SignupInput`. Validación centralizada y reutilizable. |
| `app/signup/page.tsx` | Client Component con formulario de registro (name, email, password, confirm) + botones sociales. |
| `tests/unit/auth/social-providers.test.ts` | Tests de `buildSocialProviders()` con env vars presentes y ausentes. |
| `tests/unit/auth/schemas.test.ts` | Tests de los schemas Zod: casos válidos e inválidos para login y signup. |

## 3. Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `lib/auth/index.ts` | Importar `buildSocialProviders` y pasar resultado a `betterAuth({ socialProviders: ... })`. Añadir `requireEmailVerification: false`. |
| `app/login/page.tsx` | Añadir formulario email/password encima de los botones sociales existentes. Validar con `loginSchema.parse()`. Añadir estado de error, loading, y redirect. |
| `middleware.ts` | Reemplazar `/register` por `/signup` en el check `isAuthRoute`. |
| `.env.template` | Añadir `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. |
| `docs/architecture.md` | Actualizar sección de auth: añadir email/password al flujo, actualizar diagrama, documentar `/signup`. |
| `package.json` | Añadir `zod` como dependencia. |

## 4. Firmas nuevas

### `lib/auth/social-providers.ts`

```typescript
import type { BetterAuthOptions } from 'better-auth';

type SocialProvidersConfig = NonNullable<BetterAuthOptions['socialProviders']>;

/**
 * Builds the socialProviders config object from environment variables.
 * Pure function — no DB, no side effects. Returns undefined for providers
 * whose env vars are missing.
 */
export function buildSocialProviders(): SocialProvidersConfig;
```

### `lib/auth/schemas.ts`

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
```

### `app/signup/page.tsx`

```typescript
'use client';

// Client Component — default export
// Props: none (page component)
// State: name, email, password, confirmPassword, error, isLoading
// Calls: authClient.signUp.emailAndPassword(), authClient.signIn.social()
```

## 5. Excepciones y errores

| Escenario | Origen | Manejo en UI |
|-----------|--------|--------------|
| Credenciales incorrectas | `authClient.signIn.emailAndPassword` → `error` | Banner rojo: "Invalid email or password" |
| Email ya registrado | `authClient.signUp.emailAndPassword` → `error` | Banner rojo: "An account with this email already exists" |
| Password débil (< 8 chars) | `signupSchema.parse()` → `ZodError` | Banner rojo: mensaje del schema Zod |
| Passwords no coinciden | `signupSchema.parse()` → `ZodError` | Banner rojo: "Passwords do not match" |
| Provider social falla | `authClient.signIn.social` → `error` | Banner rojo: "Could not connect with {provider}. Please try again." |
| Email inválido (formato) | `loginSchema.parse()` o `signupSchema.parse()` → `ZodError` | Banner rojo: "Please enter a valid email address" |
| Name vacío (signup) | `signupSchema.parse()` → `ZodError` | Banner rojo: "Name is required" |

Patrón UI: mismo banner rojo que `PropertyForm.tsx`:
```
bg-red-50 text-red-600 p-4 rounded-xl border border-red-100
```

Extracción de errores Zod:
```typescript
function getZodErrorMessages(error: z.ZodError): string[] {
  return error.errors.map((e) => e.message);
}
```

## 6. Alternativa descartada

### Alternativa: Validación manual con funciones puras

**Descartada** porque:
- Zod ya es usado internamente por better-auth — añadirlo como dependencia es natural.
- Los schemas Zod dan tipos inferidos gratis (`LoginInput`, `SignupInput`) — evita duplicar tipos.
- Mejor DX: mensajes de error centralizados en el schema, no dispersos en `if/else`.
- Reuso: los mismos schemas se pueden usar en server actions si el proyecto crece.
- `PropertyForm.tsx` usa validación manual inline, pero eso es deuda técnica — no razón para perpetuarla.

**Si en el futuro** se necesitan validaciones complejas (perfil de usuario, formularios de propiedad con 20 campos), Zod ya estará en el proyecto y listo para escalar.

### Alternativa: Extraer `useAuthForm` hook

**Descartada** porque:
- El proyecto no tiene custom hooks (`docs/conventions.md` §Hooks: "actualmente no existen").
- Login y signup son los únicos formularios auth — no hay reuso inmediato.
- Añadir un hook "por si acaso" viola YAGNI.

## 7. Impacto en middleware

El middleware actual (`middleware.ts` línea 9) checkea `/register` como auth route. La feature usa `/signup`. Se actualiza el string literal de `/register` a `/signup`.

Consecuencia: usuarios autenticados que accedan a `/signup` serán redirigidos a `/` (R16). El comportamiento para `/login` (R17) no cambia — ya funciona.

## 8. Impacto en `.env.template`

Se añaden 4 variables nuevas al template (sin valores, solo placeholders):

```
# Google OAuth — required for social login with Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth — required for social login with GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Estas variables ya existen en `.env.local` (configuradas en feature #2). El template se actualiza para documentarlas.

## 9. Estructura de la página `/signup`

Layout idéntico a `/login` (mismo wrapper visual, logo, footer):
- Header: "Create your account" / "Join LuxeEstate today"
- Form: name → email → password → confirm password → Submit button
- Divider: "or"
- Social buttons: Google, GitHub (idénticos a `/login`)
- Link: "Already have an account? Sign in" → `/login`

Los estilos usan los mismos tokens que `/login` (hex hardcoded existentes, no se introducen nuevos).
