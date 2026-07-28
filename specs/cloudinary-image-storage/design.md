# cloudinary-image-storage — Design

> Feature #4 — Decisiones técnicas para la integración de Cloudinary.

## 1. Archivos a crear

| Archivo | Capa | Responsabilidad |
|---------|------|-----------------|
| `lib/cloudinary.ts` | Adaptadores | Configuración del SDK `cloudinary`. Exporta `getCloudinary()` (singleton) y `uploadImageToCloudinary(file: Buffer, options?: object): Promise<string>`. Server-only — nunca se importa desde Client Components. |
| `tests/unit/cloudinary.test.ts` | Tests | Tests unitarios de la server action `uploadImage`: path exitoso, validaciones de tipo/tamaño, error de Cloudinary, sesión no autenticada. |

## 2. Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `app/admin/properties/actions.ts` | Añadir server action `uploadImage(formData: FormData): Promise<{ url: string }>` que valida sesión admin, extrae el `File` del FormData, valida tipo MIME y tamaño, y delega a `uploadImageToCloudinary`. |
| `components/admin/PropertyForm.tsx` | Reemplazar `handleImageChange`: en vez de `URL.createObjectURL`, invocar `uploadImage` por cada archivo. Añadir estado `uploadingIndices: Set<number>` para el indicador de carga. Mostrar spinner/overlay en thumbnails con upload en progreso. Mostrar errores de upload en el banner existente. |
| `next.config.ts` | Agregar `{ protocol: 'https', hostname: 'res.cloudinary.com' }` a `remotePatterns`. |
| `docs/architecture.md` | Añadir sección "Storage — Cloudinary" en adaptadores: variables de entorno, flujo de upload, decisión de signed upload. |

## 3. Firmas nuevas

```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

export function getCloudinary(): typeof cloudinary;
// Configura cloudinary.config() con process.env.CLOUDINARY_* la primera vez.
// Retorna la instancia configurada.

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string>;
// Convierte el buffer a data URI, llama cloudinary.uploader.upload().
// Retorna la secure_url. Lanza Error si Cloudinary responde con error.
```

```typescript
// app/admin/properties/actions.ts (nueva export)
export async function uploadImage(
  formData: FormData,
): Promise<{ url: string }>;
// 1. Verifica sesión admin (auth.api.getSession + get_admin_users).
// 2. Extrae File de formData.get('file').
// 3. Valida MIME (image/jpeg, image/png, image/webp, image/gif).
// 4. Valida tamaño <= 5 MB.
// 5. Convierte File a Buffer (await file.arrayBuffer()).
// 6. Llama uploadImageToCloudinary(buffer, file.type).
// 7. Retorna { url: secure_url }.
// Lanza Error con mensaje descriptivo en cualquier fallo.
```

## 4. Flujo de upload

```
PropertyForm (client)
  → usuario selecciona archivo(s)
  → handleImageChange:
      1. Validación client-side (tipo MIME, tamaño ≤ 5 MB)
         → si falla: setError() y skip
      2. Agregar placeholder al grid con estado "uploading"
      3. Llamar uploadImage(formData) — server action
      4. Si éxito: reemplazar placeholder URL con la secure_url de Cloudinary
      5. Si error: remover placeholder, setError() con mensaje
  → handleSubmit:
      → formData.images ya contiene URLs de Cloudinary
      → saveProperty(formData) — sin cambios
```

## 5. Excepciones y errores

| Escenario | Error lanzado | Manejo en PropertyForm |
|-----------|---------------|----------------------|
| Sesión no autenticada | `Error('Not authenticated')` | Redirect a `/login` (middleware ya lo hace) |
| MIME inválido | `Error('Invalid file type. Accepted: JPEG, PNG, WEBP, GIF.')` | Banner rojo en formulario |
| Tamaño > 5 MB | `Error('File exceeds maximum size of 5MB.')` | Banner rojo en formulario |
| Cloudinary API error | `Error('Failed to upload image to Cloudinary.')` | Banner rojo en formulario |
| Error de red | Propagado por `fetch` | Banner rojo en formulario |

## 6. Dependencia nueva

- **`cloudinary`** (npm): SDK oficial de Cloudinary para Node.js. Provee `v2.uploader.upload()` con signed upload. Peso razonable (~2 MB install), mantenimiento activo.

## 7. Alternativa descartada

### Unsigned upload con upload preset

**Opción**: Configurar un upload preset en el dashboard de Cloudinary y hacer
upload directo desde el browser (sin server action).

**Por qué se descarta**:
- Requiere exponer el cloud name y el upload preset en el bundle del cliente.
- El upload preset debe configurarse manualmente en el dashboard de Cloudinary
  (infraestructura no versionada).
- Menor control sobre validaciones server-side (tipo, tamaño).
- La decisión del feature_list es explícita: "Signed upload desde server action
  (API secret nunca en cliente)".

### REST API directa (sin SDK)

**Opción**: Hacer `fetch` directo a `https://api.cloudinary.com/v1_1/<cloud>/image/upload`
con firma HMAC-SHA1 manual.

**Por qué se descarta**:
- Complejidad innecesaria: firmar manualmente con HMAC-SHA1 es propenso a errores.
- El SDK oficial ya maneja retries, errores tipados y la firma.
- El SDK es el estándar de la industria para Cloudinary en Node.js.

## 8. Decisiones de diseño

- **Upload secuencial, no paralelo**: Los archivos se suben uno por uno en el
  `handleImageChange`. El scope excluye "múltiples uploads en paralelo con
  progress bar". Si se necesitan uploads paralelos en el futuro, se migra a
  `Promise.all` sin cambio de arquitectura.
- **Buffer en memoria**: El archivo se convierte a `Buffer` vía `file.arrayBuffer()`.
  Para imágenes ≤ 5 MB esto es aceptable. Si se subieran archivos más grandes,
  se migraría a streaming.
- **Sin transformaciones**: No se aplican resize, crop ni quality adjustments al
  subir. Las imágenes se guardan tal cual. Esto es out-of-scope explícito.
- **Sin eliminación**: No se eliminan imágenes de Cloudinary al borrar una
  propiedad. Out-of-scope explícito. Las imágenes quedan huérfanas en Cloudinary
  (aceptable para el volumen actual).
- **Carpeta en Cloudinary**: Las imágenes se suben a la carpeta
  `luxu-estate/properties/` dentro de Cloudinary para organizarlas.
