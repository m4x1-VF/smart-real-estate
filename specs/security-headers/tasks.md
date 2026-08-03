# Tasks — security-headers

- [x] T1 — Agregar función `headers()` en `next.config.ts` con headers de seguridad estáticos: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Cubre: R1, R3, R4, R5, R6, R7.

- [x] T2 — Agregar regla de headers específica para `/admin/:path*` en `next.config.ts` con `Cache-Control: no-store, private`. Cubre: R8.

- [x] T3 — Modificar `middleware.ts` para generar nonce criptográfico por request (`crypto.randomBytes(16).toString('base64')`), construir CSP policy con el nonce, y establecer header `Content-Security-Policy` en la respuesta. Cubre: R2.

- [x] T4 — Crear `tests/security-headers.test.ts` con tests que verifiquen: presencia de todos los headers de seguridad estáticos, formato correcto de HSTS (max-age >= 63072000, includeSubDomains, presencia de los headers X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Cubre: R1, R3, R4, R5, R6, R7.

- [x] T5 — Agregar test en `tests/security-headers.test.ts` que verifique que el middleware establece el header `Content-Security-Policy` con un nonce dinámico (dos requests producen nonces diferentes). Cubre: R2.

- [x] T6 — Agregar test en `tests/security-headers.test.ts` que verifique que las rutas `/admin/*` reciben `Cache-Control: no-store, private`. Cubre: R8.

- [x] T7 — Ejecutar `pnpm build` y verificar que completa sin errores. Cubre: R9.

- [x] T8 — Ejecutar `pnpm test:run` y verificar que pasa al 100%. Cubre: R10.
