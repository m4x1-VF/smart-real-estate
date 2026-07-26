# auth-ui — Tasks

> Feature #3 — Pasos discretos en orden. El implementer marca `[x]` al completar.
> Cada task referencia los R\<n\> que cubre.

---

- [ ] T1 — Crear `lib/auth/social-providers.ts` con la función pura `buildSocialProviders()`. La función lee `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` de `process.env` y retorna un objeto `SocialProvidersConfig`. Si las vars de un provider no están definidas, ese provider se omite del resultado. Cubre: R1, R2.

- [ ] T2 — Actualizar `lib/auth/index.ts` para importar `buildSocialProviders` y pasar el resultado como `socialProviders` en la config de `betterAuth()`. Añadir `requireEmailVerification: false` dentro de `emailAndPassword`. Cubre: R1, R2.

- [ ] T3 — Crear `tests/unit/auth/social-providers.test.ts`. Tests: (a) retorna config con Google y GitHub cuando las 4 env vars están presentes, (b) omite Google cuando `GOOGLE_CLIENT_ID` falta, (c) omite GitHub cuando `GITHUB_CLIENT_ID` falta, (d) retorna objeto vacío cuando ninguna var está. Verificar que `clientId` y `clientSecret` de cada provider coinciden con las env vars. Cubre: R1, R2.

- [ ] T4 — Añadir `zod` como dependencia: `pnpm add zod`. Verificar que `package.json` incluye `"zod"` en `dependencies`. Cubre: R11, R12 (infraestructura de validación).

- [ ] T5 — Crear `lib/auth/schemas.ts` con dos schemas Zod: `loginSchema` (email + password) y `signupSchema` (name, email, password, confirmPassword con refine de coincidencia). Exportar tipos inferidos `LoginInput` y `SignupInput`. Cubre: R11, R12 (lógica de validación).

- [ ] T6 — Crear `tests/unit/auth/schemas.test.ts`. Tests: (a) `loginSchema` acepta email válido + password, rechaza email inválido; (b) `signupSchema` acepta datos válidos, rechaza email inválido, password < 8 chars, passwords que no coinciden, name vacío. Verificar que `error.errors.map(e => e.message)` retorna mensajes legibles. Cubre: R11, R12.

- [ ] T7 — Actualizar `middleware.ts`: reemplazar `/register` por `/signup` en la línea del check `isAuthRoute`. Cubre: R16.

- [ ] T8 — Añadir test en `tests/unit/auth/middleware.test.ts`: "redirects /signup to / when a valid session cookie exists". Mock `getSessionCookie` con token válido, crear request a `/signup`, verificar redirect 307 a `/`. Cubre: R16.

- [ ] T9 — Modificar `app/login/page.tsx`: añadir formulario email/password encima de los botones sociales. El formulario incluye: input email, input password, submit button "Sign in". Estado local: `email`, `password`, `error` (string | null), `isLoading` (boolean). Al submit: prevenir default, validar con `loginSchema.safeParse({ email, password })`. Si falla: extraer mensajes de error con `error.errors.map(e => e.message)` y mostrar primer mensaje. Si pasa: llamar `authClient.signIn.emailAndPassword({ email, password, callbackURL: '/' })`. Si `error` del cliente: setear mensaje visible. Si success: `router.push('/')`. Cubre: R3, R4, R5, R6.

- [ ] T10 — Añadir manejo de error social en `app/login/page.tsx`. Modificar `handleSocialLogin`: si `authClient.signIn.social` retorna `error`, setear estado `error` con mensaje visible. Limpiar error al iniciar un nuevo intento. Cubre: R7, R8.

- [ ] T11 — Crear `app/signup/page.tsx`. Client Component con: formulario (name, email, password, confirmPassword), botones sociales (Google, GitHub), link a `/login`. Estado local: `name`, `email`, `password`, `confirmPassword`, `error`, `isLoading`. Layout visual idéntico a `/login` (mismo wrapper, logo, footer). Cubre: R9, R10, R15.

- [ ] T12 — Implementar submit de registro en `app/signup/page.tsx`. Al submit: prevenir default, validar con `signupSchema.safeParse({ name, email, password, confirmPassword })`. Si falla: extraer mensajes con `error.errors.map(e => e.message)` y mostrar primer mensaje. Si pasa: llamar `authClient.signUp.emailAndPassword({ name, email, password, callbackURL: '/' })`. Si error del server: mostrar mensaje. Si success: `router.push('/')`. Cubre: R11, R12, R13, R14.

- [ ] T13 — Actualizar `.env.template`: añadir `GOOGLE_CLIENT_ID=`, `GOOGLE_CLIENT_SECRET=`, `GITHUB_CLIENT_ID=`, `GITHUB_CLIENT_SECRET=` con comentarios descriptivos. Cubre: R1, R2 (documentación).

- [ ] T14 — Actualizar `docs/architecture.md`. Secciones a cambiar: (a) §Routing — añadir `/signup` al tree; (b) §Flujo de Autenticación — actualizar diagrama para incluir email/password; (c) §UI Componentes — añadir `app/signup/page.tsx`; (d) §better-auth — mencionar social providers configurados. Cubre: R1, R2 (documentación).

- [ ] T15 — Ejecutar `pnpm test:run` y verificar que todos los tests pasan (nuevos y existentes). Ejecutar `pnpm lint` y verificar zero errores. Cubre: todos (verificación final).

---

## Trazabilidad esperada

| R\<n\> | Task | Test esperado |
|--------|------|---------------|
| R1 | T1, T2, T3, T13 | `social-providers.test.ts` — Google config |
| R2 | T1, T2, T3, T13 | `social-providers.test.ts` — GitHub config |
| R3 | T9 | Manual — form visible en `/login` |
| R4 | T9 | Manual — submit invoca authClient |
| R5 | T9 | Manual — redirect a `/` tras login |
| R6 | T9 | Manual — error banner con credenciales wrong |
| R7 | T10 | Manual — botones sociales en `/login` |
| R8 | T10 | Manual — error banner si social falla |
| R9 | T11 | Manual — `/signup` responde 200 |
| R10 | T11 | Manual — form con 4 campos visible |
| R11 | T5, T6, T12 | `schemas.test.ts` — `signupSchema` refine |
| R12 | T5, T6, T12 | `schemas.test.ts` + manual — submit invoca authClient |
| R13 | T12 | Manual — redirect a `/` tras registro |
| R14 | T12 | Manual — error banner con email duplicado |
| R15 | T11 | Manual — botones sociales en `/signup` |
| R16 | T7, T8 | `middleware.test.ts` — redirect `/signup` → `/` |
| R17 | — | `middleware.test.ts` — test existente (línea 46-53) |
