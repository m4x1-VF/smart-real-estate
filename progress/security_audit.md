# Security Audit Report — Luxu Estate

**Date:** 2026-08-02  
**Auditor:** Automated security review  
**Scope:** Full codebase read-only audit  

---

## Executive Summary

Luxu Estate is a Next.js 16 App Router real-estate application with Supabase/Postgres backend, better-auth for authentication, and Cloudinary for image hosting. The overall security posture is **moderate**: input validation is generally strong, SQL injection risk is low thanks to parameterized queries via `postgres-js`, and file upload validation is in place. However, several significant issues were identified — most critically, **11 known dependency vulnerabilities** (including multiple HIGH-severity Next.js CVEs), **missing security headers**, **no rate limiting**, **weak password policy**, and a **cookie set without `Secure`/`SameSite` attributes**. The middleware-based auth gate is also susceptible to bypass in some edge configurations.

**Risk Summary:**

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High     | 6 |
| Medium   | 7 |
| Low      | 4 |
| **Total**| **18** |

---

## Critical Findings

### C-01 — Next.js version has multiple known HIGH-severity CVEs

**Description:** The project pins `next@16.1.6`, which is affected by 25+ known vulnerabilities including:
- **CVE: HTTP request smuggling in rewrites** (GHSA-ggv3-7p47-pfv8)
- **CVE: Middleware/Proxy bypass via segment-prefetch routes** (GHSA-26hh-7cqf-hhc6, GHSA-267c-6grr-h53f, GHSA-6gpp-xcg3-4w24)
- **CVE: Server Actions CSRF bypass via null origin** (GHSA-mq59-m269-xvcx)
- **CVE: DoS via connection exhaustion with Cache Components** (GHSA-mg66-mrh9-m8jx)
- **CVE: SSRF in Server Actions on custom servers** (GHSA-89xv-2m56-2m9x)
- **CVE: DoS in Image Optimization API** (GHSA-h64f-5h5j-jqjh, GHSA-q8wf-6r8g-63ch)
- **CVE: XSS in beforeInteractive scripts** (GHSA-gx5p-jg67-6x7h)
- **CVE: XSS in App Router with CSP nonces** (GHSA-ffhc-5mcf-pf4q)
- **Unauthenticated disclosure of internal Server Function endpoints** (GHSA-955p-x3mx-jcvp)

The fix is available: upgrade to `next@16.2.12` (per `npm audit`).

**Affected files:** `package.json` (line 21)  
**Impact:** An attacker could bypass middleware-based auth, trigger DoS, perform SSRF, or exploit XSS. The middleware bypass is particularly concerning given this app relies on middleware as the primary auth gate for `/admin/*`, `/profile/*`, `/saved/*`.  
**Remediation:**
1. Run `npm install next@16.2.12` immediately.
2. This also pulls patched `postcss` and `sharp` transitive dependencies.
3. Re-run `npm audit` after upgrading to confirm resolution.

---

## High Findings

### H-01 — No security headers configured (CSP, HSTS, X-Frame-Options, etc.)

**Description:** `next.config.ts` does not define any HTTP security headers. The application is missing:
- `Content-Security-Policy` (CSP)
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options` / `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

**Affected files:** `next.config.ts`  
**Impact:** Without CSP, any XSS vector (even minor ones) can execute arbitrary JavaScript and steal session tokens. Without HSTS, users are vulnerable to SSL-stripping MITM attacks. Missing X-Frame-Options enables clickjacking.  
**Remediation:**
```ts
// next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  // ... existing config
};
```
A CSP nonce strategy should also be implemented for Next.js 16 (note the XSS CVE above for CSP nonces — make sure the patched version is used).

---

### H-02 — Locale cookie set without `Secure`, `SameSite`, or `HttpOnly` attributes

**Description:** In `LanguageSelector.tsx` (line 18), the locale cookie is set via client-side JavaScript:
```js
document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
```
This cookie lacks `Secure`, `SameSite`, and is accessible to JavaScript (no `HttpOnly`).

**Affected files:** `components/LanguageSelector.tsx` (line 18)  
**Impact:** While the locale cookie itself is low-sensitivity, setting cookies without `SameSite` makes them vulnerable to CSRF-like exploitation. Without `Secure`, the cookie can be transmitted over unencrypted HTTP. The pattern also sets a bad precedent — if this approach is copied for sensitive cookies, the risk multiplies.  
**Remediation:**
1. Set the locale cookie server-side (in middleware or a route handler) with `Secure; SameSite=Lax; Path=/`.
2. Or at minimum add those flags: `document.cookie = \`NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax; Secure\``.

---

### H-03 — No rate limiting on authentication or sensitive endpoints

**Description:** The login (`/login`), signup (`/signup`), password change, and admin actions have no rate limiting, brute-force protection, or account lockout mechanisms. The auth API route at `app/api/auth/[...all]/route.ts` simply delegates to better-auth with no throttling.

**Affected files:**
- `app/api/auth/[...all]/route.ts`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/profile/actions.ts` (`changePassword`)
- `app/admin/users/actions.ts`

**Impact:** An attacker can perform unlimited login attempts (credential stuffing/brute force), create unlimited accounts, or spam password-change requests. Given the weak password policy (see H-04), this is especially dangerous.  
**Remediation:**
1. Deploy a rate-limiting solution (Vercel Edge Middleware + Upstash/KV, or Cloudflare Turnstile/WAF).
2. Apply rate limits on `/api/auth/*` (e.g., 5 login attempts per minute per IP).
3. Consider adding reCAPTCHA / hCaptcha / Cloudflare Turnstile on login/signup forms.
4. Implement account lockout after N failed attempts.

---

### H-04 — Weak password policy (minimum 8 characters only, no complexity requirements)

**Description:** `lib/auth/schemas.ts` and `lib/auth/profile-schemas.ts` enforce only `min(8)` on passwords with no requirements for uppercase, lowercase, digits, or special characters. `requireEmailVerification` is also set to `false` in `lib/auth/index.ts` (line 16).

**Affected files:**
- `lib/auth/schemas.ts` (line 12)
- `lib/auth/profile-schemas.ts` (line 10)
- `lib/auth/index.ts` (line 16)

**Impact:** Users can set trivially weak passwords like `aaaaaaaa` or `12345678`. Combined with no rate limiting (H-03) and no email verification, compromised credentials are highly likely.  
**Remediation:**
1. Enforce password complexity: at least 8 chars + 1 uppercase + 1 lowercase + 1 digit + 1 special character. Or use a breached-password check (e.g., Have I Been Pwned API).
2. Set `requireEmailVerification: true` to prevent disposable-email abuse.
3. Consider integrating a password strength meter on the client side.

---

### H-05 — Admin role check queries ALL admin rows on every protected action (performance + information leak risk)

**Description:** `app/admin/users/actions.ts` (lines 16-18), `app/admin/properties/actions.ts` (lines 165-168), and `lib/db/admin.ts` (lines 5-7) all run:
```sql
SELECT u.email FROM user_roles ur JOIN public."user" u ON u.id = ur.user_id WHERE ur.role = 'admin'
```
This fetches every admin email in the database on every request, then checks if the session user matches. This is inefficient and exposes all admin emails in server memory per request.

**Affected files:**
- `app/admin/users/actions.ts` (lines 16-18)
- `app/admin/properties/actions.ts` (lines 165-168)
- `lib/db/admin.ts` (lines 3-8)

**Impact:** As the admin user count grows, every admin-protected action becomes slower. If error messages leak the result set, all admin emails are disclosed. Additionally, there's no caching — each action re-queries the DB.  
**Remediation:**
1. Replace with a targeted query: `SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1`.
2. Add a server-side `isAdmin(userId)` helper that only checks the current user.
3. Consider caching admin status in the session JWT/claims to avoid per-request DB hits entirely.

---

### H-06 — Additional dependency vulnerabilities (HIGH severity)

**Description:** `npm audit` reports 11 total vulnerabilities, including:
- `brace-expansion` — DoS via memory exhaustion (HIGH, 3 CVEs)
- `flatted` — Prototype pollution + unbounded recursion DoS (HIGH, 2 CVEs)
- `js-yaml` — Quadratic-complexity DoS (HIGH)
- `minimatch` — ReDoS (HIGH, multiple CVEs)
- `picomatch` — ReDoS + Method Injection (HIGH)
- `postcss` — XSS + Path Traversal + Arbitrary file read (HIGH)
- `sharp` — libvips CVEs (HIGH)
- `ws` — Memory exhaustion DoS (HIGH)

**Affected files:** `package.json`, `package-lock.json` / `pnpm-lock.yaml`  
**Impact:** These vulnerabilities range from DoS (service disruption) to arbitrary file read (information disclosure) to prototype pollution (potential RCE).  
**Remediation:**
1. Run `npm audit fix` (or `pnpm audit fix`).
2. Most are resolved by the Next.js upgrade to 16.2.12 (which pulls patched `postcss`, `sharp`).
3. Run `npx updates -u` or equivalent to refresh transitive deps.

---

## Medium Findings

### M-01 — Middleware auth gate does not verify session server-side (cookie-presence-only check)

**Description:** `middleware.ts` uses `getSessionCookie(request)` from `better-auth/cookies` to check for a session cookie's *presence*, but does not verify the session token's validity. If better-auth's session cookie is a simple signed JWT without server-side revocation, a stolen/leaked cookie remains valid until expiry.

**Affected files:** `middleware.ts` (lines 4-25)  
**Impact:** Session hijacking via XSS, network interception, or log leakage would grant full access to `/admin/*`, `/profile/*`, `/saved/*` routes until the cookie expires.  
**Remediation:**
1. Ensure better-auth is configured with short session TTLs and refresh token rotation.
2. Add server-side session validation in the page/layout components (as is already done in some places like `profile/page.tsx`), but ensure ALL admin pages do this consistently.
3. Consider implementing session revocation (e.g., a `session_revoked_at` column checked on every sensitive request).

---

### M-02 — Admin layout authorization not verified at page level in all admin pages

**Description:** While `app/admin/users/actions.ts` and `app/admin/properties/actions.ts` have admin checks in their server actions, the admin pages themselves rely on the layout for auth gates. If the layout is bypassed or if a new admin page is added without the layout check, authorization is skipped.

**Affected files:**
- `app/admin/properties/page.tsx` — queries data but does NOT verify admin role before rendering.
- `app/admin/users/page.tsx` — queries all user data without verifying admin role before rendering.

**Impact:** A non-admin authenticated user could potentially access admin pages if they know the URL and the layout check has gaps. The data queries run regardless.  
**Remediation:**
1. Add `isAdminUser()` checks at the top of every admin page component, not just in the layout.
2. Use defense-in-depth: middleware → layout → page → server action.

---

### M-03 — User email exposed in admin user list (PII exposure)

**Description:** `app/admin/users/page.tsx` renders full user emails (line 107) and partial user IDs (line 110) in the HTML response. This is expected for admin functionality but creates PII exposure if the page is cached, logged, or scraped.

**Affected files:** `app/admin/users/page.tsx` (lines 90-163)  
**Impact:** User emails are PII under GDPR. If the admin page is accidentally made public (via caching misconfiguration, CDN misconfiguration, or auth bypass), all user emails are leaked.  
**Remediation:**
1. Add explicit `Cache-Control: no-store, private` headers to admin pages.
2. Ensure no CDN/edge caching applies to `/admin/*` routes.
3. Consider masking emails in the UI (e.g., `a***@example.com`) unless full visibility is needed.

---

### M-04 — `saveProperty` action does not validate property input with Zod

**Description:** Unlike `toggleFavorite` (which uses `toggleFavoriteSchema`) and profile actions (which use `updateProfileSchema`/`changePasswordSchema`), the `saveProperty` server action in `app/admin/properties/actions.ts` builds a payload from FormData without any Zod schema validation. The `buildPayload()` function (lines 58-100) accepts arbitrary strings and numbers without bounds checking.

**Affected files:** `app/admin/properties/actions.ts` (lines 58-141)  
**Impact:** An admin (or attacker who compromises an admin session) can submit malicious data:
- Negative prices, absurdly large numbers
- XSS payloads in `title`, `description`, `location`
- Invalid coordinates outside valid ranges
- Arbitrary `type` values beyond `'sale' | 'rent'`  
**Remediation:**
1. Create a Zod schema for property input (e.g., `propertySchema`).
2. Validate `buildPayload()` output against the schema before DB insert/update.
3. Add length limits, range checks, and enum enforcement.

---

### M-05 — Property description rendered without sanitization (stored XSS potential)

**Description:** In `app/properties/[slug]/page.tsx` (lines 198-199), `property.description` is rendered inside a `<p>` tag. While React escapes text content by default (preventing most XSS), the `prose prose-slate max-w-none` Tailwind Typography class may interact with HTML entities in unexpected ways.

**Affected files:** `app/properties/[slug]/page.tsx` (line 199)  
**Impact:** Low direct risk since React auto-escapes text nodes. However, if the rendering method changes (e.g., to `dangerouslySetInnerHTML` for rich text support in the future), this becomes a stored XSS vector. The current protection is implicit, not explicit.  
**Remediation:**
1. If rich text is ever needed, use a sanitizer like DOMPurify before rendering.
2. Add a comment documenting that `description` must NOT be rendered with `dangerouslySetInnerHTML` without sanitization.

---

### M-06 — No CSRF protection verification for server actions

**Description:** Next.js 16 has built-in CSRF protection for Server Actions, but the `next.config.ts` has `serverActions.bodySizeLimit: '10mb'` (line 34) which is unusually large. The application does not explicitly configure or verify CSRF tokens, relying entirely on Next.js defaults. Given the CVE for "null origin can bypass Server Actions CSRF checks" (GHSA-mq59-m269-xvcx) affecting this version, this is a real risk.

**Affected files:** `next.config.ts` (line 34)  
**Impact:** With the known CSRF bypass CVE in Next.js 16.1.6, an attacker could craft a malicious page that triggers server actions (like `toggleUserRole`, `saveProperty`, `uploadAvatar`) on behalf of an authenticated admin.  
**Remediation:**
1. Upgrade Next.js to 16.2.12 (fixes the CSRF bypass CVE).
2. Reduce `bodySizeLimit` to a reasonable value (e.g., `2mb` for avatars, `10mb` is excessive for most property forms).
3. Consider adding explicit CSRF tokens for the most sensitive actions (role changes, user deletion).

---

### M-07 — Cloudinary upload accepts base64 data URI (no server-side content validation)

**Description:** `lib/cloudinary.ts` uploads images to Cloudinary via a base64 data URI (line 24). The server validates MIME type and size from the `File` object metadata, but does NOT re-validate the actual file content (e.g., checking magic bytes). A crafted file with a valid MIME type but malicious content could be uploaded.

**Affected files:** `lib/cloudinary.ts` (lines 18-31)  
**Impact:** While Cloudinary performs its own content validation and transformation, a polyglot file (valid image + hidden payload) could theoretically be uploaded. The risk is mitigated by Cloudinary's processing, but defense-in-depth is lacking.  
**Remediation:**
1. Validate file magic bytes server-side (e.g., check that JPEG files start with `FF D8 FF`).
2. Re-encode/transform images server-side before uploading to Cloudinary.
3. Consider using Cloudinary's `resource_type: 'image'` with strict image validation.

---

## Low Findings

### L-01 — Console.error calls in production code leak internal error details

**Description:** Several server actions log errors with `console.error`:
- `app/admin/properties/actions.ts:138, 154, 199`
- `app/profile/actions.ts:129`
- `components/admin/PropertyForm.tsx:270` (client-side)

**Affected files:** See above  
**Impact:** If logs are exposed (e.g., via a misconfigured log aggregator, Vercel dashboard access leak), internal error details (stack traces, SQL errors, file paths) could aid attackers. Client-side console errors are visible to users in dev tools.  
**Remediation:**
1. Use a structured logging library (e.g., Pino, Winston) with log levels.
2. In production, log only error IDs, not full stack traces.
3. Remove client-side `console.error` or gate behind `process.env.NODE_ENV === 'development'`.

---

### L-02 — `getFavoritePropertyIds` and `listFavoriteProperties` accept arbitrary `userId` without authorization check

**Description:** In `app/saved/actions.ts` (lines 57-70), the server actions `getFavoritePropertyIds(userId)` and `listFavoriteProperties(userId)` accept a `userId` parameter without verifying it matches the authenticated user. Any authenticated user could query another user's favorites.

**Affected files:** `app/saved/actions.ts` (lines 57-70)  
**Impact:** Information disclosure — User A can see User B's saved/favorited properties. While not critical (favorites are low-sensitivity), it violates the principle of least privilege.  
**Remediation:**
1. Remove the `userId` parameter from these server actions.
2. Derive `userId` from the session inside the action (like `toggleFavorite` does on line 38).

---

### L-03 — `sql.unsafe(PROPERTY_COLUMNS)` usage in database queries

**Description:** `lib/db/properties.ts` uses `sql.unsafe(PROPERTY_COLUMNS)` in multiple queries (lines 114, 185, 222, 262). While `PROPERTY_COLUMNS` is a hardcoded constant (not user input), using `sql.unsafe` is a code smell that could become dangerous if the constant is ever made dynamic.

**Affected files:** `lib/db/properties.ts` (lines 85-88, 114, 185, 222, 262)  
**Impact:** Currently safe because the value is a compile-time constant. But if a developer later interpolates user input into `PROPERTY_COLUMNS`, it becomes a SQL injection vector.  
**Remediation:**
1. Replace `sql.unsafe(PROPERTY_COLUMNS)` with `sql(PROPERTY_COLUMNS)` if possible, or document why `unsafe` is required.
2. Add a comment warning against making `PROPERTY_COLUMNS` dynamic.

---

### L-04 — `.env.local` present in workspace (potential secret exposure in dev)

**Description:** `.env.local` exists in the workspace (confirmed by glob). While `.gitignore` correctly excludes `.env*` files (except `.env.template`), the file exists on disk and could be:
- Committed by mistake in a force-add
- Read by other tools/processes on the machine
- Backed up to cloud storage

**Affected files:** `.env.local`  
**Impact:** If the file contains production Supabase credentials, Cloudinary API secrets, OAuth client secrets, or the database URL, local exposure is a risk vector (e.g., malware, shared dev machines).  
**Remediation:**
1. Confirm `.env.local` is never committed (check `git log --all -- .env.local`).
2. Use a secrets manager (1Password, Doppler, Vercel Environment Variables) for production secrets.
3. Keep `.env.local` for local dev only, with dummy/test values.

---

## Security Posture Assessment

| Area | Rating | Notes |
|------|--------|-------|
| **Authentication** | 🟡 Moderate | Better-auth is solid, but weak password policy + no email verification + no rate limiting reduces effectiveness |
| **Authorization** | 🟡 Moderate | Admin checks exist but are inconsistent (actions yes, pages not always), and use inefficient queries |
| **Input Validation** | 🟢 Good | Zod used for auth/profile/favorites; property forms lack schema validation (M-04) |
| **SQL Injection** | 🟢 Low Risk | postgres-js parameterized queries used throughout; only `sql.unsafe` on constants |
| **XSS** | 🟢 Low Risk | React auto-escaping + no `dangerouslySetInnerHTML`; but missing CSP makes any XSS more impactful |
| **File Upload** | 🟡 Moderate | MIME type + size checks present, but no magic-byte validation; Cloudinary mitigates most risk |
| **Dependency Security** | 🔴 Poor | 11 known vulnerabilities including multiple HIGH-severity Next.js CVEs |
| **Configuration Security** | 🔴 Poor | No security headers, no HSTS, no CSP, locale cookie missing flags |
| **Secrets Management** | 🟡 Moderate | Env vars used correctly (no hardcoded secrets), but .env.local on disk is a risk |
| **Rate Limiting** | 🔴 None | No throttling on any endpoint |
| **CSRF** | 🔴 Vulnerable | Known CVE in current Next.js version bypasses Server Actions CSRF |

### Overall Score: **5.5/10** — Needs immediate attention

### Priority Remediation Order

1. **IMMEDIATE:** Upgrade Next.js to 16.2.12 (fixes ~25 CVEs including CSRF bypass, middleware bypass, DoS)
2. **IMMEDIATE:** Run `npm audit fix` for transitive dependency vulnerabilities
3. **This week:** Add security headers (CSP, HSTS, X-Frame-Options) to `next.config.ts`
4. **This week:** Implement rate limiting on auth endpoints
5. **This week:** Strengthen password policy (complexity + email verification)
6. **This sprint:** Fix locale cookie attributes
7. **This sprint:** Add Zod validation to `saveProperty` action
8. **This sprint:** Fix `getFavoritePropertyIds`/`listFavoriteProperties` authorization
9. **Next sprint:** Refactor admin checks to targeted queries + cache in session
10. **Backlog:** Structured logging, magic-byte file validation, CSP nonce implementation

---

## Appendix: Files Reviewed

### Authentication & Authorization
- `middleware.ts`
- `lib/auth/index.ts`, `lib/auth/client.ts`, `lib/auth/schemas.ts`, `lib/auth/profile-schemas.ts`, `lib/auth/social-providers.ts`
- `app/api/auth/[...all]/route.ts`
- `app/login/page.tsx`, `app/signup/page.tsx`

### Server Actions
- `app/profile/actions.ts`
- `app/saved/actions.ts`
- `app/admin/users/actions.ts`
- `app/admin/properties/actions.ts`

### Database
- `lib/db/client.ts`, `lib/db/admin.ts`, `lib/db/properties.ts`, `lib/db/favorites.ts`
- `db/migrations/001_extensions.sql` through `009_unaccent.sql`

### Configuration
- `next.config.ts`
- `eslint.config.mjs`
- `package.json`
- `.gitignore`

### Components (XSS review)
- `components/PropertyMap.tsx`, `components/DynamicPropertyMap.tsx`
- `components/PropertyGallery.tsx`, `components/LanguageSelector.tsx`
- `components/admin/PropertyForm.tsx`
- `app/properties/[slug]/page.tsx`
- `app/admin/users/page.tsx`, `app/admin/properties/page.tsx`
- `app/profile/page.tsx`, `app/saved/page.tsx`

### Schemas & Utilities
- `lib/favorites/schemas.ts`
- `lib/utils/normalize.ts`
- `lib/optimize-image.ts`
- `lib/cloudinary.ts`
- `types/db.ts`
