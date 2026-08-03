# Feature #9: security-dependency-updates — Implementation Report

## Summary

Updated Next.js from 16.1.6 to 16.2.12 and ran dependency updates to resolve transitive vulnerabilities. Build and all 134 tests pass.

## Versions Updated

### Direct Dependencies
| Package | Before | After |
|---------|--------|-------|
| `next` | 16.1.6 | **16.2.12** |
| `eslint-config-next` | 16.1.6 | **16.2.12** |

### Transitive Dependencies (via pnpm update)
| Package | Before | After |
|---------|--------|-------|
| `better-auth` | 1.6.23 | 1.6.25 |
| `@tailwindcss/postcss` | 4.3.2 | 4.3.3 |
| `tailwindcss` | 4.3.2 | 4.3.3 |
| `@types/leaflet` | 1.9.21 | 1.9.22 |
| `@types/react` | 19.2.17 | 19.2.18 |
| `@types/react-dom` | 19.2.3 | 19.2.4 |

### Transitive Dependencies Fixed (via npm audit fix)
- `brace-expansion` — updated to patched versions (resolved 3 high-severity CVEs)
- `flatted` — updated to patched version (resolved 2 high-severity CVEs)
- `js-yaml` — updated to patched version (resolved 2 high-severity CVEs)
- `minimatch` — updated to patched versions (resolved 3 high-severity CVEs)
- `picomatch` — updated to patched version (resolved 2 high-severity CVEs)
- `ws` — updated to patched version (resolved 2 high-severity CVEs)
- `@babel/core` — updated to patched version (resolved 1 low-severity CVE)
- `ajv` — updated to patched version (resolved 1 moderate-severity CVE)

## CVEs Resolved

### Next.js (16.1.6 → 16.2.12) — ~25 CVEs fixed
All CVEs in the range 9.3.4-canary.0 – 16.1.x are patched in 16.2.12, including:
- HTTP request smuggling in rewrites
- Middleware/Proxy bypass (segment-prefetch, dynamic route injection, i18n, Turbopack)
- Cache poisoning (RSC responses, cache-busting collisions)
- XSS (beforeInteractive scripts, CSP nonces)
- DoS (Server Components, Image Optimization API, connection exhaustion, Server Actions)
- SSRF (WebSocket upgrades, rewrites with attacker-controlled hostnames)
- CSRF bypass (null origin in Server Actions and dev HMR)
- Unbounded image disk cache growth
- Unbounded Server Action payload in Edge runtime
- Unauthenticated disclosure of internal Server Function endpoints

### Transitive Dependencies — 8 packages patched
- **brace-expansion**: 3 DoS CVEs (zero-step sequence, exponential expansion, unbounded length)
- **flatted**: DoS via unbounded recursion + prototype pollution
- **js-yaml**: 2 quadratic-complexity DoS CVEs
- **minimatch**: 3 ReDoS CVEs (repeated wildcards, GLOBSTAR backtracking, extglob)
- **picomatch**: 2 CVEs (POSIX character class injection, extglob quantifier ReDoS)
- **ws**: uninitialized memory disclosure + memory exhaustion DoS
- **@babel/core**: arbitrary file read via sourceMappingURL
- **ajv**: ReDoS when using $data option

## Remaining Vulnerabilities (9 total)

### Category A: Requires vitest 2.x → 3.x+ upgrade (BREAKING CHANGE)
| Severity | Package | Issue | Fix |
|----------|---------|-------|-----|
| Critical | `vitest` | Arbitrary file read via UI server | Upgrade to >=3.2.6 |
| High | `vite` | `server.fs.deny` bypass on Windows | Upgrade to >=6.4.3 (via vitest) |
| Moderate | `esbuild` | SSRF via dev server | Upgrade to >=0.25.0 (via vitest→vite) |
| Moderate | `vite` | Path traversal in `.map` handling | Upgrade to >=6.4.2 (via vitest) |
| Moderate | `vite` | NTLMv2 hash disclosure on Windows | Upgrade to >=6.4.3 (via vitest) |

**Action required**: Upgrade `vitest` from 2.x to 3.x+ and `@vitest/coverage-v8` accordingly. This is a **breaking change** — vitest 3.x has API changes.

### Category B: Requires next > 16.2.12 (not yet available as stable)
| Severity | Package | Issue | Fix |
|----------|---------|-------|-----|
| High | `sharp` | libvips CVEs (CVE-2026-33327/28/35590/91) | Upgrade to >=0.35.0 (pinned by next) |
| High | `postcss` | Arbitrary file read via sourceMappingURL | Upgrade to >=8.5.12 (pinned by next) |
| High | `postcss` | Path traversal in source map auto-loading | Upgrade to >=8.5.18 (pinned by next) |
| Moderate | `postcss` | XSS via unescaped `</style>` | Upgrade to >=8.5.10 (pinned by next) |

**Note**: These are dependencies of `next@16.2.12` itself. They can only be resolved when Next.js releases a version that bundles patched postcss (>=8.5.18) and sharp (>=0.35.0). Monitor Next.js releases for updates.

## Pre-existing Issues Fixed (to unblock build verification)

1. **Missing `description_placeholder` in i18n dictionaries** — The type `DashboardPropertyFormDict` required `description_placeholder` but it was missing from all 3 dictionary files (es/en/fr). Added the missing keys.

2. **Type mismatch in `PropertyForm.tsx`** — `formData[id as keyof Property]` could return `null` or `string[]` (from nullable/array fields in the DB Property type), which wasn't assignable to `parsedValue`'s type. Fixed by narrowing the type check.

## Build Results

### `pnpm build` — ✅ PASS
```
▲ Next.js 16.2.12 (Turbopack)
✓ Compiled successfully in 6.2s
✓ TypeScript check passed
✓ 14/14 static pages generated
```

### `pnpm test:run` — ✅ 134/134 PASS
```
24 test files passed (24)
134 tests passed (134)
Duration: 10.99s
```

## Warnings (non-blocking)

1. **`middleware` file convention deprecated** — Next.js 16.2 recommends migrating from `middleware.ts` to `proxy.ts`. Tracked in feature #10 (security-headers).
2. **`BETTER_AUTH_SECRET` not set** — Runtime warning during static page generation. Not a build error; occurs because the env var is not set in CI/build environment.
3. **Vite CJS build deprecated** — vitest 2.x uses Vite's CJS API which is deprecated. Resolved by vitest 3.x upgrade.

## Files Changed

| File | Change |
|------|--------|
| `package.json` | `next` 16.1.6 → 16.2.12, `eslint-config-next` 16.1.6 → 16.2.12 |
| `pnpm-lock.yaml` | Updated transitive dependencies |
| `package-lock.json` | Regenerated by `npm audit fix` |
| `data/dictionaries/es.json` | Added missing `description_placeholder` key |
| `data/dictionaries/en.json` | Added missing `description_placeholder` key |
| `data/dictionaries/fr.json` | Added missing `description_placeholder` key |
| `components/admin/PropertyForm.tsx` | Fixed type mismatch (null/string[] guard) |

## Regressions

No regressions detected. All 134 tests pass, build succeeds, and no application logic was changed.
