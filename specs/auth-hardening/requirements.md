# auth-hardening — Requirements

> Feature #11: Hardening de autenticación: rate limiting, password policy y email verification.
> Resuelve hallazgos H-03, H-04 y M-01 de la auditoría de seguridad.

---

## R1

CUANDO un cliente envía una petición POST a `/api/auth/sign-in/*` ENTONCES el sistema DEBE aplicar un rate limit de 5 peticiones por minuto por dirección IP de origen.

## R2

CUANDO un cliente envía una petición POST a `/api/auth/sign-up/*` ENTONCES el sistema DEBE aplicar un rate limit de 3 peticiones por hora por dirección IP de origen.

## R3

SI el rate limit de login o signup es excedido ENTONCES el sistema DEBE responder con HTTP 429 y un cuerpo JSON que incluya un mensaje indicando que se excedió el límite de intentos.

## R4

El sistema DEBE validar que la contraseña en el schema de registro (`signupSchema`) cumpla simultáneamente: mínimo 8 caracteres, al menos 1 letra mayúscula, al menos 1 letra minúscula, al menos 1 dígito y al menos 1 carácter especial (`!@#$%^&*()_+-=[]{}|;:',.<>?/~`"`).

## R5

El sistema DEBE validar que la nueva contraseña en el schema de cambio de contraseña (`changePasswordSchema`) cumpla la misma política de complejidad que `signupSchema` (R4).

## R6

El sistema DEBE configurar `requireEmailVerification: true` en la sección `emailAndPassword` de better-auth para que los usuarios deban verificar su email antes de poder iniciar sesión.

## R7

CUANDO un usuario con email no verificado intenta iniciar sesión con email/password ENTONCES el sistema DEBE rechazar el intento y enviar (o reenviar) un email de verificación mediante el callback `sendVerificationEmail` de better-auth.

## R8

El sistema DEBE integrar un widget de Cloudflare Turnstile en la página `/login` que genere un token de verificación antes de enviar el formulario.

## R9

El sistema DEBE integrar un widget de Cloudflare Turnstile en la página `/signup` que genere un token de verificación antes de enviar el formulario.

## R10

CUANDO el formulario de login o signup se envía ENTONCES el sistema DEBE verificar el token de Turnstile server-side contra la API de Cloudflare (`https://challenges.cloudflare.com/turnstile/v0/siteverify`) antes de procesar la autenticación.

## R11

SI el token de Turnstile es inválido, está ausente o la verificación falla ENTONCES el sistema DEBE rechazar la petición con un mensaje de error indicando que la verificación de seguridad falló.

## R12

El sistema DEBE configurar el TTL de sesión (`session.expiresIn`) a un máximo de 7 días (604800 segundos) en la configuración de better-auth.

## R13

El sistema DEBE configurar el intervalo de refresco de sesión (`session.updateAge`) a 15 minutos (900 segundos) para que la sesión se renueve automáticamente con cada uso activo.

## R14

El sistema DEBE habilitar el Content-Security-Policy para permitir los dominios de Cloudflare Turnstile: `script-src` y `frame-src` deben incluir `https://challenges.cloudflare.com`.

## R15

El sistema DEBE exponer las variables de entorno `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` en `.env.template` (sin valores) para que el operador las configure.
