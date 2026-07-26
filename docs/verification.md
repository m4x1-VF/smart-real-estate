# Verificación — Cómo demostrar que el trabajo funciona

> Regla de oro: **el agente no dice "funciona", lo demuestra**.
> Toda feature termina con evidencia ejecutable, no con afirmaciones.

## Niveles de verificación

### Nivel 1 — Tests unitarios (obligatorio)

Toda función pública en `src/` tiene al menos un test en `tests/` que:

1. Cubre el camino feliz.
2. Cubre al menos un camino de error si la función puede fallar.

**Comando para ejecutarlos:**

```bash
pnpm test          # corre Vitest en modo watch
pnpm test:run      # corre Vitest una sola vez (CI / pre-commit)
pnpm test:coverage # corre con reporte de cobertura
```

Los tests viven en `tests/` junto al código (`*.test.ts` / `*.spec.ts`) y se
descubren automáticamente con la configuración por defecto de Vitest.

### Nivel 2 — Test de integración del CLI (obligatorio para features de UI)

Las features que añaden comandos al CLI se verifican ejecutando el CLI real
contra un archivo temporal.

**Convención:** los tests de integración viven en `tests/integration/*.test.ts`
y se etiquetan con `// @vitest-environment node` cuando el CLI corre fuera
del navegador. Se montan fixtures con `node:os.tmpdir()` (o `os.tmpdir()` +
`fs.mkdtempSync`) y se limpian con `afterEach` / `afterAll`.

**Ejemplo con Vitest + Node child_process:**

```ts
import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tmp = mkdtempSync(join(tmpdir(), "luxe-cli-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("CLI integration", () => {
  it("procesa el fixture y devuelve el código esperado", () => {
    const fixture = join(tmp, "input.json");
    writeFileSync(fixture, JSON.stringify({ ok: true }));

    const result = spawnSync("node", ["dist/cli.js", fixture], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("ok");
  });
});
```

**Comando:**

```bash
pnpm test:run tests/integration
```

### Nivel 3 — Smoke test manual (opcional pero recomendado)

Antes de cerrar la sesión, ejecuta un flujo end-to-end con un archivo
temporal en `/tmp`.

**Convención:** el smoke test se automatiza como un test E2E con
`tests/e2e/*.test.ts` usando un servidor local efímero (`node:http` o
Playwright) y un directorio temporal para uploads/outputs. En Windows,
sustituir `/tmp` por `os.tmpdir()` (que ya resuelve a la carpeta Temp del
usuario).

**Comando:**

```bash
pnpm test:run tests/e2e
```

### Nivel 4 — Trazabilidad de requirements (obligatorio para features con `"sdd": true`)

Cada `R<n>` de `specs/<name>/requirements.md` debe poder mapearse a al
menos un test concreto en `tests/`. El reviewer rechaza si falta cobertura.

El implementer documenta el mapa en `progress/impl_<name>.md`:

```markdown
## Trazabilidad
- R1 → `test_recent_default_limit`
- R2 → `test_recent_invalid_limit`
- R3 → `test_recent_custom_limit`
```

## Anti-patrones (no hacer)

- ❌ "He añadido el comando, debería funcionar." → falta test ejecutable.
- ❌ Test que solo verifica que la función no lanza excepción. → tiene que
  comprobar el resultado concreto.
- ❌ `mock` del filesystem. → usa `tempfile.TemporaryDirectory()` real.
