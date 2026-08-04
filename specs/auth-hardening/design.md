# auth-hardening — Design

> Decisiones técnicas para el hardening de autenticación.

---

## 1. Archivos a crear

| Archivo | Responsabilidad |
|---------|----------------|
| `lib/rate-limit.ts` | Instancias de `Ratelimit` de Upstash: `loginRateLimit` (5/min) y `signupRateLimit` (3/h). Server-only (`import 'server-only'`). |
| `lib/turnstile.ts` | Función `verifyTurnstileToken(token: string): Promise<boolean>`. Server-only. Llama a `https://challenges.cloudflare.com/turnstile/v0/siteverify`. |
| `tests/unit/auth/rate-limit.test.ts` | Tests de rate limiting: login bloqueado tras 5 intentos, signup bloqueado tras 3 intentos. |
| `tests/unit/auth/password-policy.test.ts` | Tests de password complexity: acepta válidas, rechaza cada regla individualmente. |
| `tests/unit/auth/turnstile.test.ts` | Tests de verificación de Turnstile: token válido, inválido, ausente. |
| `tests/unit/auth/session-config.test.ts` | Tests de configuración de sesión: expiresIn, updateAge, cookieCache. |

## 2. Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `lib/auth/index.ts` | Añadir `session: { expiresIn, updateAge, cookieCache }`, cambiar `requireEmailVerification: true`, añadir `emailVerification: { sendVerificationEmail, sendOnSignIn }`. |
| `lib/auth/schemas.ts` | `signupSchema.password`: regex de complejidad (min 8, upper, lower, digit, special). `loginSchema.password` se mantiene simple (solo `min(1)`). |
| `lib/auth/profile-schemas.ts` | `changePasswordSchema.newPassword`: misma regex de complejidad que `signupSchema`. |
| `middleware.ts` | (1) Rate limiting para POST `/api/auth/sign-in/*` y `/api/auth/sign-up/*` usando `lib/rate-limit.ts`. (2) Verificación de Turnstile token (extraído de header `x-turnstile-token`) para las mismas rutas. (3) CSP: añadir `https://challenges.cloudflare.com` a `script-src` y `frame-src`. |
| `app/login/page.tsx` | Integrar widget `<Turnstile>` de `@marsidev/react-turnstile`. Pasar token como header `x-turnstile-token` via `fetchOptions.headers` de `authClient.signIn.email()`. |
| `app/signup/page.tsx` | Integrar widget `<Turnstile>`. Pasar token como header `x-turnstile-token` via `fetchOptions.headers` de `authClient.signUp.email()`. |
| `.env.template` | Añadir `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`. |
| `package.json` | Añadir `@upstash/ratelimit`, `@upstash/redis`, `@marsidev/react-turnstile`. |
| `docs/architecture.md` | Documentar rate limiting, password policy, Turnstile y session management en las secciones correspondientes. |

## 3. Firmas nuevas

```typescript
// lib/rate-limit.ts
import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const loginRateLimit: Ratelimit;   // slidingWindow(5, "60 s")
export const signupRateLimit: Ratelimit;  // slidingWindow(3, "1 h")
```

```typescript
// lib/turnstile.ts
import 'server-only';

export async function verifyTurnstileToken(token: string): Promise<boolean>;
// POST a https://challenges.cloudflare.com/turnstile/v0/siteverify
// con secret + response. Retorna true si success === true.
```

```typescript
// middleware.ts — nuevas funciones internas
function getClientIP(request: NextRequest): string;
// Extrae IP de x-forwarded-for o request.ip
```

## 4. Excepciones y manejo de errores

| Escenario | Comportamiento |
|-----------|---------------|
| Rate limit excedido | HTTP 429 + JSON `{ error: "Too many attempts. Please try again later." }` |
| Turnstile token inválido | HTTP 403 + JSON `{ error: "Security verification failed. Please try again." }` |
| Turnstile token ausente | HTTP 403 + JSON `{ error: "Security verification required." }` |
| Email no verificado en login | better-auth maneja esto nativamente: rechaza login y reenvía email de verificación (si `sendOnSignIn: true`). |
| Upstash Redis no disponible | Rate limit falla abierto (permite la petición) con log de error. No bloquear usuarios por infraestructura caída. |

## 5. Configuración de sesión (better-auth)

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,  // 7 días
  updateAge: 60 * 15,             // 15 minutos (sliding window)
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60,               // 5 minutos (reduce DB calls)
  },
}
```

## 6. Email verification

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
},
emailVerification: {
  sendOnSignIn: true,
  sendVerificationEmail: async ({ user, url, token }, request) => {
    // Log en desarrollo. En producción, integrar con servicio de email.
    console.log(`[Email Verification] To: ${user.email}, URL: ${url}`);
  },
},
```

## 7. Password complexity regex (Zod)

```typescript
const passwordComplexity = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
```

Se extrae a una constante reutilizable en `lib/auth/schemas.ts` y se importa desde `lib/auth/profile-schemas.ts`.

## 8. Alternativa descartada

### reCAPTCHA v3 en vez de Cloudflare Turnstile

**Descartada.** reCAPTCHA v3 requiere enviar datos de usuario a Google, tiene historial de problemas de privacidad y la UX degrada cuando el score es bajo (muestra challenges visuales). Cloudflare Turnstile es privacy-friendly (no tracking cross-site), tiene mejor UX (invisible por defecto, sin challenges visuales en la mayoría de casos) y es gratuito sin límites de requests.

### Rate limiting in-memory (Map/LRU cache)

**Descartada.** En entorno serverless (Vercel/Next.js), cada invocación es aislada — un Map en memoria no persiste entre requests. Upstash Redis es serverless-friendly (HTTP-based, sin conexiones TCP persistentes) y funciona correctamente en Edge Runtime.

### Librería externa de password complexity (zxcvbn)

**Descartada.** `zxcvbn` añade ~800KB al bundle y su heurística es overkill para los requisitos. La regex de Zod cubre las 5 reglas requeridas (min 8, upper, lower, digit, special) sin dependencias adicionales y es completamente testable.

### Rate limiting en route handler en vez de middleware

**Descartada.** El middleware corre en Edge Runtime (más rápido, sin cold start de Node.js), se ejecuta antes de que el request llegue al handler, y puede rechazar requests early sin cargar el runtime de better-auth. Además, el middleware ya existe y tiene la infraestructura CSP; añadir rate limiting ahí es incremental.
