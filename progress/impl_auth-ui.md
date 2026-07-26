# auth-ui — Trazabilidad R\<n\> → test

| R\<n\> | Task | Test que cubre |
|--------|------|----------------|
| R1 | T1, T2, T3, T13 | `tests/unit/auth/social-providers.test.ts` — "returns config with Google and GitHub when all env vars are present" |
| R2 | T1, T2, T3, T13 | `tests/unit/auth/social-providers.test.ts` — "returns config with Google and GitHub when all env vars are present" |
| R3 | T9 | Manual — form email/password visible en `/login` |
| R4 | T9 | Manual — submit invoca `authClient.signIn.emailAndPassword` |
| R5 | T9 | Manual — `router.push('/')` tras login exitoso |
| R6 | T9 | Manual — error banner "Invalid email or password" + mensajes Zod |
| R7 | T10 | Manual — botones Google/GitHub en `/login` |
| R8 | T10 | Manual — error banner "Could not connect with {provider}" |
| R9 | T11 | Manual — `/signup` responde 200 |
| R10 | T11 | Manual — form con name/email/password/confirmPassword |
| R11 | T5, T6, T12 | `tests/unit/auth/schemas.test.ts` — "rejects non-matching passwords", "rejects password shorter than 8 characters", "rejects empty name", "rejects invalid email" |
| R12 | T5, T6, T12 | `tests/unit/auth/schemas.test.ts` — valid data tests + manual submit |
| R13 | T12 | Manual — `router.push('/')` tras registro exitoso |
| R14 | T12 | Manual — error banner "An account with this email already exists" |
| R15 | T11 | Manual — botones Google/GitHub en `/signup` |
| R16 | T7, T8 | `tests/unit/auth/middleware.test.ts` — "redirects /signup to / when a valid session cookie exists" |
| R17 | — | `tests/unit/auth/middleware.test.ts` — "redirects /login to / when a valid session cookie exists" (pre-existing) |
