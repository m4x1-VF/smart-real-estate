# Plan de Remediación de Seguridad — Luxu Estate

**Fecha:** 2026-08-02  
**Basado en:** `progress/security_audit.md` (18 findings, score 5.5/10)

---

## Resumen

Las 18 vulnerabilidades se agrupan en **9 features** organizadas por prioridad y afinidad técnica. Las features marcadas con `sdd: false` son cambios triviales que se implementan directamente. Las marcadas con `sdd: true` pasan por el flujo completo de spec.

---

## Features propuestas (en orden de ejecución)

### 🔴 Fase 1 — INMEDIATO (esta semana)

| # | Feature | Hallazgos | SDD | Complejidad |
|---|---------|-----------|-----|-------------|
| 9 | **security-dependency-updates** | C-01, H-06 | ❌ | Trivial |
| 10 | **security-headers** | H-01 | ✅ | Media |
| 11 | **auth-hardening** | H-03, H-04, M-01 | ✅ | Compleja |

**Feature 9 — security-dependency-updates**
- Actualizar `next` de 16.1.6 → 16.2.12 (fixea ~25 CVEs)
- Ejecutar `npm audit fix` para dependencias transitivas
- Verificar que `pnpm build` y `pnpm test` siguen verdes
- Sin SDD: es un upgrade de dependencia, no lógica nueva

**Feature 10 — security-headers**
- Agregar CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy a `next.config.ts`
- Implementar estrategia de CSP nonces compatible con Next.js 16
- Sin cache en rutas `/admin/*` (Cache-Control: no-store, private)
- SDD: toca configuración global y puede afectar funcionalidad existente

**Feature 11 — auth-hardening**
- Rate limiting en `/api/auth/*` y server actions sensibles (Upstash KV o similar)
- Password policy: min 8 + uppercase + lowercase + digit + special char
- Activar `requireEmailVerification: true` en better-auth
- Considerar Turnstile/reCAPTCHA en login/signup
- Session revocation: TTL corto + refresh token rotation
- SDD: cambio significativo en auth, múltiples archivos

---

### 🟡 Fase 2 — Este sprint

| # | Feature | Hallazgos | SDD | Complejidad |
|---|---------|-----------|-----|-------------|
| 12 | **cookie-and-csrf-fixes** | H-02, M-06 | ❌ | Trivial |
| 13 | **admin-auth-refactor** | H-05, M-02, M-03 | ✅ | Media |
| 14 | **property-validation** | M-04 | ✅ | Trivial |

**Feature 12 — cookie-and-csrf-fixes**
- Locale cookie: mover a server-side (middleware) con `Secure; SameSite=Lax; Path=/`
- Reducir `serverActions.bodySizeLimit` de 10mb a 2mb
- Sin SDD: cambios de configuración puntuales

**Feature 13 — admin-auth-refactor**
- Reemplazar query "SELECT ALL admins" por `SELECT 1 WHERE user_id = $1 AND role = 'admin' LIMIT 1`
- Crear helper `isAdmin(userId)` con cache en sesión
- Agregar verificación de rol a nivel de página en todas las admin pages
- Agregar `Cache-Control: no-store, private` a rutas admin
- SDD: refactor de queries y patrón de autorización

**Feature 14 — property-validation**
- Crear `propertySchema` con Zod (title, description, price, coordinates, type enum, amenities)
- Validar `buildPayload()` output contra el schema antes de DB insert/update
- Agregar bounds checking para coordenadas y precios
- SDD: nuevo schema, afecta server action existente

---

### 🟢 Fase 3 — Próximo sprint

| # | Feature | Hallazgos | SDD | Complejidad |
|---|---------|-----------|-----|-------------|
| 15 | **favorites-auth-fix** | L-02 | ❌ | Trivial |
| 16 | **structured-logging** | L-01 | ✅ | Media |
| 17 | **file-upload-hardening** | M-07, M-05 | ✅ | Media |

**Feature 15 — favorites-auth-fix**
- Remover parámetro `userId` de `getFavoritePropertyIds` y `listFavoriteProperties`
- Derivar `userId` de la sesión dentro de cada action
- Sin SDD: fix de 2 líneas por action

**Feature 16 — structured-logging**
- Reemplazar `console.error` con logger estructurado (Pino/Winston)
- En producción: loguear solo error IDs, no stack traces
- Gate client-side `console.error` detrás de `NODE_ENV === 'development'`
- SDD: patrón transversal, múltiples archivos

**Feature 17 — file-upload-hardening**
- Validar magic bytes server-side (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`)
- Documentar que `description` NO debe renderizarse con `dangerouslySetInnerHTML`
- Considerar re-encoding server-side antes de Cloudinary
- SDD: nuevo módulo de validación, afecta upload flow

---

## Orden de ejecución recomendado

```
Fase 1 (esta semana):
  9. security-dependency-updates  ← primero, desbloquea todo
  10. security-headers             ← config global
  11. auth-hardening               ← el más complejo

Fase 2 (este sprint):
  12. cookie-and-csrf-fixes        ← quick win
  13. admin-auth-refactor          ← mejora performance + seguridad
  14. property-validation          ← Zod schema nuevo

Fase 3 (próximo sprint):
  15. favorites-auth-fix           ← quick win
  16. structured-logging           ← mejora observabilidad
  17. file-upload-hardening        ← defense in depth
```

## Métricas de éxito

- **Antes:** Score 5.5/10, 18 findings (1 crítico, 6 altos)
- **Después de Fase 1:** Score ~7.5/10, 0 críticos, 0-1 altos
- **Después de Fase 2:** Score ~8.5/10, 0 altos
- **Después de Fase 3:** Score ~9/10, todos los findings resueltos

## Hallazgos no cubiertos (aceptados o backlog)

| Hallazgo | Razón |
|----------|-------|
| L-03 — `sql.unsafe(PROPERTY_COLUMNS)` | Riesgo bajo: constante hardcodeada. Documentar y monitorear. |
| L-04 — `.env.local` en disco | Riesgo operacional, no de código. Usar secrets manager en producción. |
