# Requirements — security-headers

## R1
El sistema DEBE aplicar headers de seguridad HTTP estáticos a todas las rutas vía la función `headers()` en `next.config.ts`.

## R2
CUANDO el middleware procesa una request, el sistema DEBE generar un nonce criptográfico aleatorio por request y establecer el header `Content-Security-Policy` con ese nonce en la respuesta.

## R3
El sistema DEBE establecer el header `Strict-Transport-Security` con `max-age=63072000; includeSubDomains; preload` en todas las rutas.

## R4
El sistema DEBE establecer el header `X-Frame-Options: DENY` en todas las rutas.

## R5
El sistema DEBE establecer el header `X-Content-Type-Options: nosniff` en todas las rutas.

## R6
El sistema DEBE establecer el header `Referrer-Policy: strict-origin-when-cross-origin` en todas las rutas.

## R7
El sistema DEBE establecer el header `Permissions-Policy` con `camera=(), microphone=(), geolocation=()` en todas las rutas.

## R8
CUANDO una request apunta a una ruta `/admin/*`, el sistema DEBE establecer el header `Cache-Control: no-store, private` en la respuesta.

## R9
CUANDO se ejecuta `pnpm build`, el sistema DEBE completar sin errores.

## R10
CUANDO se ejecuta `pnpm test:run`, el sistema DEBE pasar al 100%.
