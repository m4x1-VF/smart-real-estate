# Implementación `neon-db-migration`

> Bitácora de ejecución de `specs/neon-db-migration/tasks.md` (T1..T14).
> Implementer; revisión final: reviewer.

## Feature en curso

- Feature: #1 `neon-db-migration` (`feature_list.json`).
- Status arranco: `in_progress`.
- Spec aprobado por humano el 2026-07-20 (ver `progress/current.md`).

## Plan

T1..T14 de `specs/neon-db-migration/tasks.md`, en orden. Después de cada
task, marcar `[x]` en `tasks.md`.

## Bitácora

- 2026-07-20 — Leí documentación obligatoria (`AGENTS.md`,
  `docs/{architecture,conventions,verification}.md`, spec completo,
  `feature_list.json`) y archivos de referencia
  (`types/{supabase,property}.ts`, `lib/supabase/*`, call sites, schema
  SQL, `package.json`, `.env.template`).
- 2026-07-20 — Cargué skills: luxu-estate-ui, nextjs-16, react-19,
  typescript, vitest.
- 2026-07-20 — Confirmado: el edit page usa `params.id` pero la URL
  Lleva el `slug` (Link en la lista apunta a
  `/admin/properties/${property.slug}/edit`). La query Supabase usaba
  `.eq('slug', params.id)`. Mantengo `getPropertyBySlug(params.id)` en
  T11; NO añado `getPropertyById` porque el contrato real de la URL es
  por slug (el `id` en el path es solo el nombre del segmento dinámico).
- 2026-07-20 — Inicio T1..T14.
