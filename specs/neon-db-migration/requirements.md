# `neon-db-migration` — Requirements

> Spec de la feature #1 (`feature_list.json`). Migración de la capa de
> datos del proyecto desde Supabase a Neon (PostgreSQL gestionado).
>
> Idioma: español neutro (alineado con el resto del repo). Las firmas y
> nombres de código van en inglés.
>
> Convenciones:
> - Cada requisito usa EARS estricto (plantillas de `docs/specs.md`).
> - Cada requisito DEBE ser verificable por al menos un test concreto.
> - El contrato de la feature vive en `feature_list.json`. Estos `R<n>`
>   cubren UNO-A-UNO los `acceptance` del contrato — no se añaden
>   requisitos fuera del scope.

---

## R1 — Singleton del cliente Postgres

El sistema DEBE exponer una única instancia compartida del cliente
`postgres` desde `lib/db/client.ts`, configurada con `connection_limit=1`
y `DATABASE_URL` como variable de entorno requerida.

**Contexto:** Node runtime serverless-friendly; mismo proceso importa
varias veces el módulo y todas las llamadas DEBEN reutilizar un único
cliente (sin re-crear conexiones por cada Server Component).

## R2 — Validación de `DATABASE_URL` en arranque

El sistema DEBE lanzar un error explícito si `DATABASE_URL` no está
definida, ANTES de ejecutar cualquier query contra la base.

**Contexto:** en CI y en build, la ausencia de la variable NO debe
causar un error críptico en runtime. En tests unitarios que no tocan
la base, el helper DEBE permitir un stub sin abrir conexión.

## R3 — Reemplazo del cliente de datos en la home pública

CUANDO la ruta `/` se renderiza, el sistema DEBE leer propiedades desde
Neon (no desde Supabase) usando el cliente de R1, devolviendo la misma
forma `Property[]` que consume `NewInMarket`.

**Contexto:** reemplazo directo de
`supabase.from('properties').select('*').eq('is_active', true)…` en
`app/page.tsx`. Filtros (location, min/max price, type, beds, baths) y
paginación `range(from, to)` DEBEN seguir funcionando.

## R4 — Detalle de propiedad por slug desde Neon

CUANDO la ruta `/properties/[slug]` se renderiza y se invoca
`generateMetadata`, el sistema DEBE leer la propiedad por `slug` desde
Neon (no desde Supabase).

**Contexto:** reemplazo de `supabase.from('properties').select('*').eq('slug', slug).single()`
tanto en `generateMetadata` como en `PropertyPage`.

## R5 — Listado admin paginado desde Neon

CUANDO la ruta `/admin/properties` se renderiza, el sistema DEBE leer
propiedades (activas + inactivas) desde Neon, devolver la cuenta total
para paginación y devolver la página actual ordenada por `created_at
desc`.

**Contexto:** reemplazo de los dos `select` (uno con `count: 'exact', head: true`
y otro con `.range(from, to)`) en `app/admin/properties/page.tsx`.

## R6 — Escrituras admin (insert y update) vía server action

CUANDO el formulario `PropertyForm.tsx` (Client Component) envía un alta
o una edición, el sistema DEBE invocar una server action que escribe
contra Neon (no contra Supabase).

**Contexto:** el `insert`, `update` y `togglePropertyStatus` actualmente
son llamadas al cliente de Supabase; pasan a server actions que usan el
cliente de R1.

## R7 — Toggle de `is_active` desde Neon

CUANDO se activa o desactiva una propiedad en `/admin/properties`
(formulario de toggle), el sistema DEBE invertir `is_active` en la fila
correspondiente de Neon y revalidar la ruta `/admin/properties`.

**Contexto:** reemplazo de la server action `togglePropertyStatus` en
`app/admin/properties/page.tsx`.

## R8 — Tipos de dominio manuales para el schema Postgres

El sistema DEBE definir `Property`, `UserRole`, `PropertyType` y
`AppRole` en `types/db.ts` como tipos manuales que reflejan el schema
versionado en `db/migrations/001..005`.

**Contexto:** elimina la dependencia de los tipos generados por
Supabase (`Database['public']['Tables']['properties']`). Migración
total a tipos manuales — sin generación desde CLI.

## R9 — `DATABASE_URL` documentada en `.env.template`

El sistema DEBE añadir `DATABASE_URL=` (sin valor, con un comentario
descriptivo) en `.env.template`, junto a la línea que mantiene como
compatibilidad opcional `NEXT_PUBLIC_SUPABASE_URL=`.

**Contexto:** la variable es obligatoria para R2; `.env.template` es el
contrato que documenta las env vars del proyecto.

## R10 — Trazabilidad a tests del repositorio Postgres

POR CADA función exportada desde `lib/db/properties.ts` (y módulos
análogos), el sistema DEBE contar con al menos un test en `tests/unit/db/`
que ejecute la query contra un cliente mockeado o un Postgres de test y
verifique el resultado concreto (no "no lanza excepción").

**Contexto:** la regla de verificación Nivel 4 (`docs/verification.md`)
obliga a mapear cada `R<n>` a un test. Esta requirement operativa lo
hace explícito.
