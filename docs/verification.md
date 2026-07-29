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

### Nivel 2 — Tests de integración (obligatorio para server actions)

Toda server action debe tener al menos un test de integración que verifique
el flujo completo:

1. Validación de input (Zod schema).
2. Verificación de autenticación/autorización.
3. Ejecución de la lógica de negocio (queries, uploads, etc.).
4. Respuesta o side effect esperado.

**Convención:** los tests de integración viven en `tests/integration/*.test.ts`
y usan `happy-dom` como entorno (configurado automáticamente por `environmentMatchGlobs`).

**Ejemplo con Vitest + server action:**

```ts
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { createProperty } from "@/app/admin/properties/actions";

vi.mock("@/lib/db/properties", () => ({
  insertProperty: vi.fn().mockResolvedValue({ id: 1, title: "Test" }),
}));

describe("createProperty server action", () => {
  it("creates a property with valid data and returns the new row", async () => {
    const formData = new FormData();
    formData.set("title", "Casa de prueba");
    formData.set("price", "500000");
    
    const result = await createProperty(formData);
    
    expect(result.success).toBe(true);
    expect(result.data.title).toBe("Casa de prueba");
  });

  it("rejects invalid data with validation errors", async () => {
    const formData = new FormData();
    formData.set("title", "");
    
    const result = await createProperty(formData);
    
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
```

**Comando:**

```bash
pnpm test:run tests/integration
```

### Nivel 3 — Tests de componentes y E2E (obligatorio para features con UI)

Toda feature que añade o modifica componentes React debe tener al menos un
test que verifique el comportamiento del usuario:

1. Renderizado correcto del componente.
2. Interacciones del usuario (clicks, inputs, navegación).
3. Estado final esperado (mensaje de éxito, redirect, actualización de UI).

**Convención:** los tests de componentes viven en `tests/integration/components/*.test.ts`
y usan `happy-dom` + `@testing-library/react` + `@testing-library/user-event`.

**Ejemplo con React Testing Library:**

```ts
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";

describe("LoginForm", () => {
  it("submits valid credentials and redirects", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));
    
    expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
  });

  it("shows error message for invalid credentials", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.type(screen.getByLabelText(/email/i), "bad@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /login/i }));
    
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

**Comando:**

```bash
pnpm test:run tests/integration/components
```

### Nivel 4 — Trazabilidad de requirements (obligatorio para features con `"sdd": true`)

Cada `R<n>` de `specs/<name>/requirements.md` debe poder mapearse a al
menos un test concreto en `tests/`. El mapa debe incluir tests de L1, L2 y L3.
El reviewer rechaza si falta cobertura en cualquier nivel.

El implementer documenta el mapa en `progress/impl_<name>.md`:

```markdown
## Trazabilidad
- R1 → `tests/unit/auth/schemas.test.ts` (L1), `tests/integration/auth/login.test.ts` (L2)
- R2 → `tests/unit/db/properties.test.ts` (L1), `tests/integration/properties/create.test.ts` (L2)
- R3 → `tests/integration/components/PropertyForm.test.ts` (L3)
```

## Regla de cierre (no negociable)

**No se cierra una feature sin L2 + L3 verdes.** El reviewer verifica:

1. Server actions tienen tests de integración (L2).
2. Componentes React tienen tests de comportamiento (L3).
3. Trazabilidad R↔test está documentada (L4).

Si falta alguno, el reviewer rechaza y el implementer debe completar antes
de marcar `done`.

## Anti-patrones (no hacer)

- ❌ "He añadido el comando, debería funcionar." → falta test ejecutable.
- ❌ Test que solo verifica que la función no lanza excepción. → tiene que
  comprobar el resultado concreto.
- ❌ `mock` del filesystem. → usa `tempfile.TemporaryDirectory()` real.
- ❌ Mockear toda la lógica de negocio en tests de integración. → mockea
  solo dependencias externas (DB, APIs), no la lógica que estás testeando.
- ❌ Test de componente que solo verifica que renderiza sin crash. → debe
  verificar el comportamiento del usuario (interacciones + estado final).
