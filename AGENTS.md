# AGENTS.md — Mapa de navegación para agentes de IA

> Este archivo es el **punto de entrada** para cualquier agente que trabaje en este
> repositorio. NO es una biblia de reglas: es un **mapa**. Lee solo lo que
> necesites cuando lo necesites (divulgación progresiva).

---

## 0. Skills por intención

Carga la skill correspondiente **antes** de tocar código de su scope. El
system prompt ya las indexa todas; aquí va solo el mapa mental.

| Intención                                                | Skills                                              |
|----------------------------------------------------------|-----------------------------------------------------|
| Next.js App Router, server actions, caching              | `nextjs-16`                                         |
| Componentes, hooks, refs como props                      | `react-19`                                          |
| Estilos con Tailwind, `cn()`, CSS variables              | `tailwind-4`                                        |
| TypeScript estricto (tipos, `any`, type guards)          | `typescript`                                        |
| Validación de payloads (forms, server actions)           | `zod-4`                                             |
| Estado cliente                                            | `zustand-5`                                         |
| Tests unitarios / integration                            | `vitest`                                            |
| Patrones UI específicos del proyecto                     | `luxu-estate-ui`                                    |
| Commits conventional-commits                             | `luxu-estate-commit`                                |
| Ciclo SDD completo (explore → propose → spec → tasks → apply → verify → archive) | `sdd-init` → `sdd-archive` — ver §4 para el diagrama de estados |
| Crear skills                         | `skill-creator`|

> NO listes skills que no necesites. Si dudas, **no la cargues** — la
> mayoría de tareas no requieren invocar ninguna explícitamente.

---

## 1. Antes de empezar (obligatorio)

1. Lee `progress/current.md` para entender en qué estado quedó la última sesión.
2. Lee `feature_list.json`. Toda feature nueva (`"sdd": true`) pasa por
   **Spec Driven Development** — ver `docs/specs.md` y §4 de este archivo.
4. Lee `docs/specs.md` antes de tocar cualquier spec o feature `sdd: true`.

## 2. Mapa del repositorio

| Archivo / carpeta            | Qué contiene                                                                | Cuándo leerlo |
|------------------------------|------------------------------------------------------------------------------|---------------|
| `AGENTS.md`                  | Este mapa. Punto de entrada único para cualquier agente.                     | Siempre, al arrancar. |
| `CHECKPOINTS.md`             | Checklists C1–C6 que el reviewer usa para decidir si una sesión puede cerrar. | Antes de marcar nada como `done` o cerrar sesión. |
| `README.md`                  | Descripción humana del proyecto y guía de puesta en marcha.                  | Cuando necesites contexto de producto o setup. |
| `package.json`              | Dependencias y scripts (`dev`, `build`, `lint` — ver Comandos en `docs/architecture.md`). | Antes de añadir un paquete o cambiar comandos. |
| `middleware.ts`              | Refresco de sesión Supabase + auth gate de `/admin/*` (detalle en `docs/architecture.md` §Middleware). | Si tocas autenticación o routing. |
| `.env.template`             | Plantilla de variables de entorno (Supabase, etc.).                          | Al configurar el entorno local. |
| `init.sh`                    | Script de bootstrap que prepara y valida el repo.                            | Lo ejecuta el leader al arrancar la sesión. |
| `feature_list.json`          | Inventario de features con `status` y flag `sdd`.                            | Antes de elegir la siguiente feature. |
| `docs/architecture.md`       | **Fuente de verdad de estructura y stack**: capas Clean/Hexagonal, comandos, routing, componentes, adaptadores, convenciones clave. | Antes de tocar código de producto — leer primero, el resto de filas de esta tabla no repiten su contenido. |
| `docs/conventions.md`        | Convenciones de código (naming, formato, imports, errores).                  | Antes de escribir o revisar código. |
| `docs/specs.md`              | Reglas del flujo SDD y formato EARS para `requirements.md`.                  | Antes de redactar o tocar un spec. |
| `docs/verification.md`       | Niveles 1–4 de verificación — ver también §3.                                | Antes de declarar nada como `done`. |
| `progress/current.md`        | Resumen de la sesión activa.                                                | Al arrancar y al cerrar. |
| `progress/history.md`        | Histórico de sesiones cerradas.                                             | Al cerrar sesión para mover el resumen. |
| `specs/<feature>/`           | `requirements.md`, `design.md`, `tasks.md` de cada feature `sdd: true`.      | Trabajar en una feature con SDD. |
| `app/`, `components/`, `lib/`, `types/`, `data/`, `public/` | Capas Externa/Adaptadores/Dominio — estructura y responsabilidades detalladas en `docs/architecture.md` §2–4. | Al tocar UI, rutas, adaptadores o el modelo — leer la sección correspondiente de `architecture.md` antes de editar. |
| `tests/`                     | Tests Vitest (unit, integration, e2e).                                        | Cualquier cambio verificable. |
| `vitest.config.ts`           | Configuración de Vitest (runner, entorno de test).                           | Cambios de setup de testing. |
| `.opencode/agents/`          | Definiciones de agentes: `leader`, `spec_author`, `implementer`, `reviewer`. | Diseñar o ajustar el flujo multi-agente. |
| `.opencode/skills/`          | Skills técnicos del proyecto (nextjs-16, react-19, tailwind-4, zustand-5, etc.). | Cuando una tarea entra en el scope de la skill. |

> Archivos de configuración pura (`tsconfig.json`, `next.config.ts`,
> `eslint.config.mjs`, `postcss.config.mjs`) y carpetas generadas
> (`node_modules/`, `.next/`) no están listados aquí: su contenido se explica
> a sí mismo por convención de ecosistema. Consúltalos directamente si necesitas
> tocarlos.

## 3. Reglas duras (no negociables)

- **Una sola feature a la vez.** No mezcles cambios de varias tareas en la misma sesión.
- **No declares una tarea `done` sin pruebas verdes.** Ejecuta `./init.sh` y
  asegúrate de que el bloque de tests pasa al 100% (ver `docs/verification.md`).
- **No saltes la fase de spec.** Toda feature con `"sdd": true` debe pasar
  por `spec_author` y obtener aprobación humana antes de tocar código.
- **No saltes la puerta de aprobación humana.** El leader detiene el flujo
  en `spec_ready` y espera.
- **Documenta lo que haces** en `progress/current.md` mientras trabajas, no al final.
- **Deja el repositorio limpio** antes de cerrar la sesión (ver §5).
- **Si no sabes algo, busca en `docs/`** antes de inventarlo.
- **Usa únicamente skills de este repo** (`.opencode/skills/`, listadas en §0). No
  invoques skills de perfil u otros proyectos aunque estén disponibles
  globalmente — si una tarea necesita una skill que no existe aquí, créala con
  `skill-creator` en vez de tomar una prestada.

## 4. Flujo de trabajo (SDD)

```
pending → [spec_author] → spec_ready → ⏸ HUMANO → in_progress → [implementer → reviewer] → done
```

1. El leader detecta la primera feature `pending` con `"sdd": true`.
2. El leader lanza `spec_author`, que crea
   `specs/<name>/{requirements,design,tasks}.md` y marca el status como
   `spec_ready`.
3. **Pausa.** El humano lee el spec en `specs/<name>/` y aprueba (o pide cambios).
4. Una vez aprobado, el leader cambia el status a `in_progress` y lanza `implementer`.
5. El implementer ejecuta `tasks.md` una a una, marcándolas `[x]`.
6. El reviewer verifica trazabilidad `R<n>` ↔ test y tasks completas;
   aprueba o rechaza.
7. Si aprueba, el implementer marca `done` y mueve el resumen a
   `progress/history.md`.

## 5. Cierre de sesión (lifecycle)

Antes de terminar:

1. Si la tarea está acabada: marca `status: "done"` en `feature_list.json`.
2. Mueve el resumen de `progress/current.md` al final de `progress/history.md`.
3. Vacía `progress/current.md` dejando solo la plantilla.
4. **Persiste el resumen de la sesión** — ver skill `session-memory` para el
   procedimiento completo (estructura del resumen y cuándo registrar
   decisiones individuales). Este paso es **obligatorio y no se salta**: sin
   él la próxima sesión empieza a ciegas.
5. No dejes archivos temporales, ni `print()` de debug, ni TODOs sin contexto.

## 6. Si te bloqueas

- Relee la sección relevante de `docs/`.
- Si la herramienta no hace lo que esperas, **no inventes un workaround**:
  documenta el bloqueo en `progress/current.md` y para la sesión.