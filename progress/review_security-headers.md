# Review — feature #10 security-headers

**Veredicto:** APPROVED

## Trazabilidad requirements ↔ tests

| Req | Descripción | Test | Resultado |
|-----|-------------|------|-----------|
| R1 | Headers de seguridad estáticos vía `headers()` en `next.config.ts` | `next.config.ts — static security headers > returns headers() with all required security headers for catch-all route` (línea 18, `tests/security-headers.test.ts`) | [x] |
| R2 | Nonce criptográfico por request + header CSP en middleware | `middleware — CSP nonce > sets Content-Security-Policy header with nonce` (línea 68) + `generates different nonces for different requests` (línea 84) | [x] |
| R3 | HSTS con `max-age=63072000; includeSubDomains; preload` | `sets HSTS with max-age >= 63072000, includeSubDomains, and preload` (línea 41) | [x] |
| R4 | `X-Frame-Options: DENY` | Primer test, línea 31: `expect(headerMap.get('X-Frame-Options')).toBe('DENY')` | [x] |
| R5 | `X-Content-Type-Options: nosniff` | Primer test, línea 32: `expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff')` | [x] |
| R6 | `Referrer-Policy: strict-origin-when-cross-origin` | Primer test, línea 33-35 | [x] |
| R7 | `Permissions-Policy: camera=(), microphone=(), geolocation=()` | Primer test, línea 36-38 | [x] |
| R8 | `Cache-Control: no-store, private` para `/admin/*` | `next.config.ts — Cache-Control for admin routes > sets Cache-Control: no-store, private for /admin/:path*` (línea 105) | [x] |
| R9 | `pnpm build` completa sin errores | Verificado: compiled successfully, 14/14 static pages generated, 0 errors | [x] |
| R10 | `pnpm test:run` pasa al 100% | Verificado: 25 files, 139/139 tests pass | [x] |

## Tasks completas

- T1: [x] — `next.config.ts` líneas 37-58, headers() con 5 headers estáticos
- T2: [x] — `next.config.ts` líneas 54-57, Cache-Control para `/admin/:path*`
- T3: [x] — `middleware.ts` líneas 25-42, nonce + CSP header
- T4: [x] — `tests/security-headers.test.ts` líneas 17-57, tests de headers estáticos
- T5: [x] — `tests/security-headers.test.ts` líneas 61-99, tests de CSP nonce
- T6: [x] — `tests/security-headers.test.ts` líneas 104-116, test de Cache-Control admin
- T7: [x] — Build verificado sin errores
- T8: [x] — Tests verificados 139/139 pass

## Verificación de implementación

### Headers en next.config.ts
- [x] `X-Frame-Options: DENY` (línea 41)
- [x] `X-Content-Type-Options: nosniff` (línea 42)
- [x] `Referrer-Policy: strict-origin-when-cross-origin` (línea 43)
- [x] `Permissions-Policy: camera=(), microphone=(), geolocation=()` (líneas 44-47)
- [x] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (líneas 48-51)
- [x] Source pattern `/(.*)` cubre todas las rutas (línea 39)

### CSP nonce en middleware.ts
- [x] Genera nonce con Web Crypto API: `crypto.getRandomValues(new Uint8Array(16))` (línea 27) — Edge Runtime compatible
- [x] Codifica en base64 con `btoa()` (línea 28)
- [x] CSP incluye todas las directivas del design: `default-src`, `script-src` con nonce + strict-dynamic, `style-src`, `img-src` con sources, `font-src`, `connect-src`, `frame-ancestors 'none'` (líneas 30-38)
- [x] Establece header CSP en la respuesta (línea 41)

### Cache-Control para admin
- [x] Source `/admin/:path*` con `Cache-Control: no-store, private` (líneas 55-56)

### Edge Runtime compatibility
- [x] No usa `crypto.randomBytes` (Node.js) — usa `crypto.getRandomValues` (Web Crypto API)
- [x] No usa `Buffer` — usa `btoa()` + `String.fromCharCode()`
- [x] Build no produce warnings de Edge Runtime

### Arquitectura y convenciones
- [x] No añade dependencias externas (no changes to `package.json`)
- [x] Respeta estructura: headers estáticos en `next.config.ts`, lógica dinámica en `middleware.ts`
- [x] No hay `console.log` de debug ni TODOs sin contexto
- [x] Código limpio, sigue convenciones del proyecto

## Nota sobre design deviation

El design.md original especificaba `import { randomBytes } from 'crypto'` (Node.js). La implementación usa `crypto.getRandomValues(new Uint8Array(16))` (Web Crypto API). Esta desviación está **documentada y justificada** en `progress/impl_security-headers.md` y es una mejora: resuelve el warning de Edge Runtime que habría producido el código original. Funcionalmente equivalente (16 bytes aleatorios → base64).

## Nota sobre test flaky

En la primera ejecución de `pnpm test:run`, un test **no relacionado** (`tests/unit/auth/auth.test.ts > creates the auth instance without errors using PostgresJSDialect`) hizo timeout a 5000ms. En la segunda ejecución y en ejecución aislada, pasa correctamente. Este es un test flaky pre-existente que no tiene relación con los cambios de security-headers. No bloquea la aprobación.

## Checkpoints

- C1 — El arnés está completo:
  - [x] Existen `AGENTS.md`, `feature_list.json`, `progress/current.md`
  - [x] Existen `docs/architecture.md`, `docs/conventions.md`, `docs/verification.md`
  - [ ] `./init.sh` — archivo no existe en el repositorio (pre-existing, no causado por esta feature)

- C2 — El estado es coherente:
  - [x] Una sola feature en `in_progress` (#10 security-headers)
  - [x] Features previas `done` tienen tests que pasan
  - [x] `progress/current.md` describe la sesión activa

- C3 — El código respeta la arquitectura:
  - [x] No se añaden módulos fuera de lo previsto
  - [x] No se añaden dependencias externas en `package.json`
  - [x] No hay `console.log` ni TODOs sueltos

- C4 — La verificación es real:
  - [x] `tests/` tiene tests de security-headers (`tests/security-headers.test.ts`, 5 tests)
  - [x] `pnpm test:run` muestra 139 tests y todos verdes (segunda ejecución)
  - [x] Tests usan imports reales del config y middleware, no mocks de filesystem

- C5 — La sesión se cerró bien:
  - [x] No hay archivos temporales sin trackear
  - [ ] `progress/history.md` — pendiente de actualizar al cerrar sesión
  - [x] Feature #10 reflejada correctamente como `in_progress`

- C6 — Spec Driven Development:
  - [x] Feature #10 tiene `specs/security-headers/{requirements,design,tasks}.md`
  - [x] `requirements.md` usa formato EARS (CUANDO... DEBE...)
  - [x] Todas las tasks T1–T8 marcadas `[x]` en `tasks.md`
  - [x] Cada `R<n>` cubierto por al menos un test concreto

## Recomendaciones (no bloqueantes)

1. **Flaky test**: `tests/unit/auth/auth.test.ts` tiene un test que ocasionalmente hace timeout en la suite completa. Considerar aumentar el timeout de 5000ms a 10000ms o mockear la conexión DB en ese test específico.
2. **init.sh**: El archivo referenced en `CHECKPOINTS.md` C1 no existe. Considerar crearlo o actualizar `CHECKPOINTS.md`.
