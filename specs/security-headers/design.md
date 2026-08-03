# Design — security-headers

## Archivos a modificar

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `next.config.ts` | Modificar | Agregar función `headers()` con headers de seguridad estáticos y Cache-Control para `/admin/*` |
| `middleware.ts` | Modificar | Agregar generación de nonce por request y establecer header CSP |
| `tests/security-headers.test.ts` | Crear | Tests unitarios que verifican la presencia de headers de seguridad |

## Firmas nuevas

### `next.config.ts` — función `headers()`

```ts
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    ],
  },
  {
    source: '/admin/:path*',
    headers: [
      { key: 'Cache-Control', value: 'no-store, private' },
    ],
  },
],
```

### `middleware.ts` — CSP nonce injection

Agregar antes del `return NextResponse.next()`:

```ts
import { randomBytes } from 'crypto';

// Generar nonce por request
const nonce = randomBytes(16).toString('base64');

// CSP policy
const cspHeader = [
  `default-src 'self'`,
  `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' https://res.cloudinary.com https://images.unsplash.com https://images.pexels.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.tile.openstreetmap.org data:`,
  `font-src 'self' https://fonts.gstatic.com`,
  `connect-src 'self' https://sjlojbdoihgappqtmads.supabase.co`,
  `frame-ancestors 'none'`,
].join('; ');

const response = NextResponse.next();
response.headers.set('Content-Security-Policy', cspHeader);
return response;
```

### `tests/security-headers.test.ts`

```ts
// Test helper que extrae y valida headers de seguridad
// - Verifica presencia de cada header requerido
// - Verifica formato de HSTS (max-age >= 63072000)
// - Verifica CSP contiene nonce
// - Verifica Cache-Control en rutas admin
```

## CSP Policy — Justificación de directivas

| Directiva | Valor | Razón |
|-----------|-------|-------|
| `default-src` | `'self'` | Restrictivo por defecto, solo same-origin |
| `script-src` | `'self' 'nonce-{NONCE}' 'strict-dynamic'` | Nonce por request + trust propagation para scripts cargados dinámicamente |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind CSS genera inline styles; nonces son imprácticos con utility-first CSS |
| `img-src` | Sources específicos | Cloudinary, Unsplash, Pexels, Google avatars, GitHub avatars, OpenStreetMap tiles, data: URIs |
| `font-src` | `'self' https://fonts.gstatic.com` | Google Fonts para Material Icons |
| `connect-src` | `'self' https://sjlojbdoihgappqtmads.supabase.co` | API calls a Supabase (Neon via Supabase client residual) |
| `frame-ancestors` | `'none'` | Reemplaza X-Frame-Options como defensa en profundidad |

## Nonce — Mecanismo

1. `middleware.ts` genera un nonce de 16 bytes aleatorio por request usando `crypto.randomBytes`
2. El nonce se codifica en base64 y se inyecta en el header CSP
3. Next.js 16 maneja internamente los nonces para sus scripts de hidratación
4. `frame-ancestors 'none'` en CSP reemplaza funcionalmente `X-Frame-Options: DENY` (se mantiene ambos por defensa en profundidad)

## Cache-Control para admin

- Se configura en `next.config.ts` `headers()` con source `/admin/:path*`
- Valor: `no-store, private` — previene cacheo de datos sensibles en proxies y browser cache
- Alternativa descartada: middleware.ts — más simple en next.config.ts ya que es estático y no requiere lógica dinámica

## Alternativas descartadas

| Alternativa | Descartada porque |
|-------------|-------------------|
| CSP sin nonces (`unsafe-inline` para scripts) | Vulnerable a XSS inline; nonces son el estándar recomendado |
| CSP nonces en `next.config.ts` headers() | `headers()` no soporta valores dinámicos por request; el nonce sería estático e inseguro |
| Cache-Control en middleware | Más complejo sin beneficio; `next.config.ts` headers() es suficiente para path-specific headers estáticos |
| `style-src` con nonces | Tailwind genera cientos de inline styles; nonces son imprácticos y `unsafe-inline` es aceptable para estilos |
