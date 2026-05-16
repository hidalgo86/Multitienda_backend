# Products — Documentación (variants con precio)

Última actualización: 13/10/2025

## Resumen

- **Variants** es la fuente de verdad para inventario y precio: `variants: [{ size, stock, price }]`.
- **REST** se usa para crear/actualizar (multipart por imagen). **GraphQL** expone solo consultas (read-only).
- **Validaciones:** Los mensajes de error son descriptivos y coherentes, por ejemplo: "La talla debe ser una de: ...", "El stock debe ser un entero no negativo", "El precio debe ser un número válido mayor o igual a cero y con hasta 2 decimales".
- **Enums:** REST usa strings (`niña`, `niño`, `unisex`, etc.), GraphQL usa tokens en mayúsculas (`NINA`, `NINO`, `UNISEX`, etc.).
- **Visibilidad pública:** solo productos disponibles con al menos una variante con stock > 0.
- **Estados automáticos:** si el stock total llega a 0 → "agotado"; si vuelve a > 0 → "disponible".

## Tabla de contenido

- Modelo de datos
- Enumeraciones
- Reglas de validación
- Estados y transiciones
- Endpoints REST
  - Crear producto (POST /products)
  - Actualizar producto (PUT /products/:id)
  - Ajustar stock por talla (PATCH /products/:id/variants)
  - Actualizar precio por talla (PATCH /products/:id/variants/price)
  - Actualizar datos generales (PATCH /products/:id/details)
  - Eliminar (DELETE /products/:id)
  - Restaurar (PATCH /products/:id/restore)
  - Borrado fuerte (DELETE /products/:id/hard)
- GraphQL (solo consultas)
  - Consultas (admin/public)
  - Filtros y paginación
  - Ordenamiento
  - Notas y particularidades
- Manejo de imágenes
- Errores y formato de respuesta
- Ejemplos rápidos
- Cambios importantes (Breaking changes)
- Próximos pasos (opcional)

---

## Modelo de datos

Product

- id: string
- name: string
- description?: string
- genre: 'niña' | 'niño' | 'unisex'
- variants?: Variant[]
- imageUrl?: string
- imagePublicId?: string
- status: 'disponible' | 'agotado' | 'eliminado'
- createdAt?: Date
- updatedAt?: Date

Variant

- size: Size (ver enum)
- stock: number (entero no negativo)
- price: number (>= 0)

Notas

- Ya no existe `price` a nivel raíz del producto. El precio vive en cada variante.
- No existen los campos legacy `size` ni `stock` a nivel raíz del producto.
- El stock total se calcula como la suma de `variants[].stock`.

## Enumeraciones

Genre

- niña
- niño
- unisex

ProductStatus

- disponible
- agotado
- eliminado

Size

- RN, 3M, 6M, 9M, 12M, 18M, 24M
- 2T, 3T, 4T, 5T, 6T, 7T, 8T, 9T, 10T, 12T

## Reglas de validación

- **name:** requerido, string no vacío. Mensaje: "El nombre debe ser un texto"
- **genre:** requerido en create, uno de [niña, niño, unisex]. Mensaje: "El género debe ser uno de: niña, niño, unisex"
- **variants (create):** requerido; arreglo no vacío. Mensaje: "variants es requerido"
- **variants (update):** opcional; si se envía, reemplaza TODO el arreglo.
- **variants[].size:** requerido en create; enum Size (normalizado a mayúsculas). Mensaje: "La talla debe ser una de: RN, 3M, ..."
- **variants[].stock:** requerido en create; entero no negativo (string validada, se parsea a number). Mensaje: "El stock debe ser un entero no negativo"
- **variants[].price:** requerido en create; string numérica con hasta 2 decimales (se parsea a number ≥ 0). Mensaje: "El precio debe ser un número válido mayor o igual a cero y con hasta 2 decimales"
- **Archivo:** imagen JPEG/PNG/WebP, máx 5MB. Mensaje: "Validation failed (expected type is image/(jpeg|png|webp))"

## Estados y transiciones

- En creación:
  - Si la suma de stock de variants === 0 → status inicial: "agotado".
  - Si stock total > 0 → status inicial: "disponible" (por defecto).
- En actualización:
  - Si no envías status explícito y el producto no está "eliminado":
    - Si stock total resultante === 0 → "agotado"
    - Si stock total resultante > 0 y venía de "agotado" → "disponible"
- No se puede restaurar a "eliminado" (en método restore).

## Endpoints REST

Todos en el controlador `products.controller.ts`.
Autenticación: ApiBearerAuth anotado a nivel de clase; asegurar guards si aplica.

### POST /products — Crear producto (multipart)

- Consumes: multipart/form-data
- Campos:
  - file?: binary (opcional)
  - name: string (requerido)
  - description?: string
  - genre: string (enum Genre) (requerido)
  - variants: requerido; dos formas de envío:
    - Como JSON en string: `[{"size":"RN","stock":"2","price":"19.99"},{"size":"3M","stock":"5","price":"21.50"}]`
    - Anidado multipart: `variants[0].size=RN`, `variants[0].stock=2`, `variants[0].price=19.99`, …
- Respuesta 201: Product
- Errores 400: validaciones de campos y archivo

Ejemplo (multipart con JSON en variants):

- file = <binary>
- name = Body Recicla Variantes
- description = Body por tallas
- genre = unisex
- variants = [{"size":"RN","stock":"2","price":"19.99"},{"size":"3M","stock":"5","price":"21.50"}]

Respuesta ejemplo:
{
"id": "p1",
"name": "Body Recicla Variantes",
"description": "Body por tallas",
"genre": "unisex",
"variants": [
{ "size": "RN", "stock": 2, "price": 19.99 },
{ "size": "3M", "stock": 5, "price": 21.5 }
],
"imageUrl": "https://...",
"status": "disponible",
"createdAt": "2025-10-12T...",
"updatedAt": "2025-10-12T..."
}

### PUT /products/:id — Actualizar producto (multipart)

- Consumes: multipart/form-data
- Ruta: /products/:id
- Campos (opcionales)
  - file?: binary
  - name?: string
  - description?: string
  - genre?: string (enum Genre)
  - variants?: si se envía, REEMPLAZA el arreglo completo. Cada objeto puede incluir `price` para actualizarlo; si no se envía `price`, se preserva el valor actual de esa talla.
- Comportamiento
  - Si variants total == 0 → status: "agotado" (si no se envió status explícito)
  - Si variants total > 0 y venía de "agotado" → "disponible"
- Respuesta 200: Product
- Errores 400/404 según validación/id

### PATCH /products/:id/variants — Ajustar stock por talla

- Body (uno de los dos):
  - { size: Size, stock: number } → set absoluto
  - { size: Size, stockDelta: number } → ajuste incremental (puede ser negativo, nunca deja stock < 0)
- Reglas: valida talla (enum Size) y stock no negativo
- Efecto en status: si total stock queda 0 → "agotado"; si sube de 0 y venía de "agotado" → "disponible" (si no está eliminado)
- Respuesta 200: Product

### PATCH /products/:id/variants/price — Actualizar precio por talla

- Body:
  - { size: Size, price: string } → precio absoluto (>= 0, hasta 2 decimales)
- Reglas: valida talla (enum Size) y que price sea un número válido (hasta 2 decimales y >= 0)
- Si la talla no existía, se crea automáticamente con stock 0 y el precio indicado
- Respuesta 200: Product

Ejemplo:

```
PATCH /products/677e.../variants/price
{
  "size": "RN",
  "price": "25.00"
}
```

### PATCH /products/:id/details — Actualizar datos generales

- Body (opcionales): { name?, description?, genre?, status? }
- Nota: ya no existe `price` a nivel raíz. El precio se gestiona por variante.
- Respuesta 200: Product

### DELETE /products/:id — Soft delete

- Marca el producto como "eliminado"
- No modifica variants ni imagen
- Respuesta 200: Product (status = "eliminado")

### PATCH /products/:id/restore — Restaurar un producto eliminado

- Body: { status: 'disponible' | 'agotado' }
- No se permite restaurar con estado 'eliminado'
- Respuesta 200: Product

### DELETE /products/:id/hard — Eliminación definitiva

- Borra el documento del producto
- Respuesta 200: Product (el que fue eliminado)

## GraphQL (solo consultas)

- GraphQL es de solo lectura (read-only) para Products. Las escrituras (crear/actualizar/soft-delete/restore) se hacen por REST.
- Consultas disponibles: `products(input)` (público), `adminProducts(input)` (admin), `product(id)` (detalle).
- ProductType expone `variants` (no existe price a nivel raíz).

Filtros (resumen)

- name?: string (regex, i)
- minPrice/maxPrice?: number
- genre?: Genre
- sizes?: Size[] (filtra por `variants.size`)
- status?: ProductStatus (solo admin)
- Público: fuerza `status=disponible` y `variants: { $elemMatch: { stock: { $gt: 0 } } }`

Ordenamiento

- Nuevo parámetro opcional `sort` en `ProductsQueryInput` (GraphQL):
  - NAME_ASC | NAME_DESC
  - CREATED_AT_ASC | CREATED_AT_DESC
  - PRICE_MIN_ASC | PRICE_MIN_DESC
  - STOCK_TOTAL_ASC | STOCK_TOTAL_DESC
- Se aplica en `products` y `adminProducts`.

### Cómo ordenar

- Pasa el enum en `ProductsQueryInput.sort` para indicar el orden deseado. El orden se aplica después de filtrar y antes de paginar.
- Orden simple por campos: `NAME_*`, `CREATED_AT_*`.
- Orden derivado (requiere cálculo):
  - `PRICE_MIN_*` ordena por el precio mínimo entre las variantes de cada producto.
  - `STOCK_TOTAL_*` ordena por la suma de `variants.stock`.
- Desempates: para órdenes derivados se usa también `_id` ascendente para estabilidad entre documentos con el mismo valor calculado.
- Recomendación: especifica siempre `sort` para resultados estables entre páginas.

Ejemplo 1 — Precio mínimo ascendente (público)

```
query Products($input: ProductsQueryInput) {
  products(input: $input) {
    items { id name variants { size stock price } createdAt updatedAt }
    total
    page
    totalPages
  }
}
```

Variables:

```
{
  "input": {
    "filters": { "minPrice": 10, "maxPrice": 50 },
    "pagination": { "page": 1, "limit": 12 },
    "sort": "PRICE_MIN_ASC"
  }
}
```

Ejemplo 2 — Más stock primero (descendente)

```
query Products($input: ProductsQueryInput) {
  products(input: $input) {
    items { id name variants { size stock price } }
    total
    page
    totalPages
  }
}
```

Variables:

```
{
  "input": {
    "pagination": { "page": 1, "limit": 12 },
    "sort": "STOCK_TOTAL_DESC"
  }
}
```

Notas:

- En consultas públicas, si incluyes `minPrice`/`maxPrice`, el filtro se combina con `stock > 0` en un único `$elemMatch` para garantizar disponibilidad y rango de precio.
- En consultas admin, el rango de precio no fuerza `stock > 0`.
- También puedes ordenar por `CREATED_AT_*` para ver recientes/antiguos y por `NAME_*` para listados alfabéticos.

Notas y particularidades

- En GraphQL, los enums usan identificadores en MAYÚSCULAS. Por ejemplo, `Genre` espera `NINO | NINA | UNISEX` y `Size` espera `RN | M3 | M6 | ...` en la query. En variables JSON también se pasan como strings, por ejemplo: `{ "sizes": ["M3"] }`.
- En REST, los valores subyacentes de `Size` son las cadenas como se muestran en la enumeración de datos (p. ej., `"3M"`, `"2T"`). Ambos representan la misma talla; GraphQL usa el token `M3` y REST usa el valor `"3M"`.
- `product(id)` en GraphQL está tipado como nullable en el esquema, pero el backend actualmente lanza un error `NotFoundException` si no existe. El cliente verá un error GraphQL en vez de `null`.
- En consultas públicas, ahora se combinan correctamente los filtros de precio con `stock > 0` mediante un único `$elemMatch`.

Ejemplo query (admin)

```
query Products($input: ProductsQueryInput) {
  adminProducts(input: $input) {
    items { id name genre status variants { size stock price } }
    total
    page
    totalPages
  }
}
```

Variables:

```
{
  "input": {
    "filters": { "genre": "NINO", "sizes": ["RN"] },
    "pagination": { "page": 1, "limit": 10 },
    "sort": "NAME_ASC"
  }
}
```

Ejemplo query (público)

```
query PublicProducts($input: ProductsQueryInput) {
  products(input: $input) {
    items { id name variants { size stock price } }
    total
    page
    totalPages
  }
}
```

Variables:

```
{
  "input": {
    "filters": { "name": "body", "minPrice": 10, "maxPrice": 50 },
    "pagination": { "page": 1, "limit": 12 },
    "sort": "PRICE_MIN_ASC"
  }
}
```

Ejemplo orden por stock total (descendente)

```
query PublicProducts($input: ProductsQueryInput) {
  products(input: $input) {
    items { id name variants { size stock price } }
    total
    page
    totalPages
  }
}
```

Variables:

```
{
  "input": {
    "pagination": { "page": 1, "limit": 12 },
    "sort": "STOCK_TOTAL_DESC"
  }
}
```

Detalle por id

```
query ProductById($id: String!) {
  product(id: $id) {
    id
    name
    description
    genre
    status
    variants { size stock price }
    imageUrl
  }
}
```

Variables:

```
{ "id": "<PRODUCT_ID>" }
```

Nota: No hay mutaciones GraphQL para crear/actualizar/eliminar/restaurar productos.

## Manejo de imágenes

- El backend guarda las URLs/IDs recibidos, pero no gestiona subida ni borrado de archivos externos.
- Tipos y tamaños permitidos dependen del cliente o servicio que realice la subida.

## Errores y formato

Estructura típica (REST):

```
{
  "statusCode": 400,
  "timestamp": "2025-10-12T12:00:00.000Z",
  "message": "El precio debe ser un número válido mayor o igual a cero y con hasta 2 decimales"
}
```

## Ejemplos rápidos

- Crear con imagen y variants (JSON en multipart)
- Actualizar nombre, precio y variants
- Reemplazar variants a 0 → pasa a "agotado"

## Cambios importantes

- Eliminados size/stock a nivel raíz. Ahora cada variante tiene `price`.
- Sustituido filtro por precio a `variants.$elemMatch.price`.
- Mensajes de validación descriptivos y coherentes en todos los endpoints.
- Tests y Swagger alineados a variants con precio.

## Próximos pasos (opcional)

- Más ejemplos Swagger/GraphQL con variants anidados y enums en variables.
- README con notas de interoperabilidad (REST vs GraphQL para enums).

````markdown
# Products — Documentación (variants con precio)

Última actualización: 12/10/2025

## Resumen

- Variants es la fuente de verdad para inventario y precio: `variants: [{ size, stock }]`.
- REST se usa para crear/actualizar (multipart por imagen). GraphQL expone solo consultas (read-only).
- Visibilidad pública: solo productos disponibles con al menos una variante con stock > 0.
- Estados automáticos: si stock total llega a 0 → "agotado"; si vuelve a > 0 → "disponible".

## Tabla de contenido

- Modelo de datos
- Enumeraciones
- Reglas de validación
- Estados y transiciones
- Endpoints REST
  - Crear producto (POST /products)
  - Actualizar producto (PUT /products/:id)
  - Ajustar stock por talla (PATCH /products/:id/variants)
  - Actualizar precio por talla (PATCH /products/:id/variants/price)
  - Actualizar datos generales (PATCH /products/:id/details)
  - Eliminar (DELETE /products/:id)
  # Products — Documentación (variants-only)
  Última actualización: 13/10/2025
- GraphQL (solo consultas)
  - Consultas (admin/public)
  - Filtros y paginación
- Manejo de imágenes
- Errores y formato de respuesta
- Ejemplos rápidos
- Cambios importantes (Breaking changes)
- Próximos pasos (opcional)

---

## Modelo de datos

Product

- id: string
- name: string
- description?: string
- genre: 'niña' | 'niño' | 'unisex'
- variants?: Variant[]
- imageUrl?: string
- imagePublicId?: string
- status: 'disponible' | 'agotado' | 'eliminado'
- createdAt?: Date
- updatedAt?: Date

Variant

- size: Size (ver enum)
- stock: number (entero no negativo)
- price: number (>= 0)

Notas

- Ya no existe `price` a nivel raíz del producto. El precio vive en cada variante.
- No existen los campos legacy `size` ni `stock` a nivel raíz del producto.
- El stock total se calcula como la suma de `variants[].stock`.

## Enumeraciones

Genre

- niña
- niño
- unisex

ProductStatus

- disponible
- agotado
- eliminado

Size

- RN, 3M, 6M, 9M, 12M, 18M, 24M
- 2T, 3T, 4T, 5T, 6T, 7T, 8T, 9T, 10T, 12T

## Reglas de validación

- name: requerido, string no vacío.
- genre: requerido en create, uno de [niña, niño, unisex].
- variants (create): requerido; arreglo no vacío.
- variants (update): opcional; si se envía, reemplaza TODO el arreglo.
- variants[].size: requerido en create; enum Size (normalizado a mayúsculas).
- variants[].stock: requerido en create; entero no negativo (string validada, se parsea a number).
- variants[].price: requerido en create; string numérica con hasta 2 decimales (se parsea a number ≥ 0).
- Si se envía archivo: imagen JPEG/PNG/WebP, máx 5MB.

Mensajes típicos

- "variants es requerido"
- "Invalid variant size: ..."
- "Variant stock must be non-negative"
- "Variant price must be non-negative"
- "Validation failed (expected type is image/(jpeg|png|webp))"

## Estados y transiciones

- En creación:
  - Si la suma de stock de variants === 0 → status inicial: "agotado".
  - Si stock total > 0 → status inicial: "disponible" (por defecto).
- En actualización:
  - Si no envías status explícito y el producto no está "eliminado":
    - Si stock total resultante === 0 → "agotado"
    - Si stock total resultante > 0 y venía de "agotado" → "disponible"
- No se puede restaurar a "eliminado" (en método restore).

## Endpoints REST

Todos en el controlador `products.controller.ts`.
Autenticación: ApiBearerAuth anotado a nivel de clase; asegurar guards si aplica.

### POST /products — Crear producto (multipart)

- Consumes: multipart/form-data
- Campos
  - Como JSON en string: `[{"size":"RN","stock":"2"},{"size":"3M","stock":"5"}]`
  - Anidado multipart: `variants[0].size=RN`, `variants[0].stock=2`, …
- Respuesta 201: Product
- Errores 400: validaciones de campos y archivo

Ejemplo (multipart con JSON en variants)

- file = <binary>
- name = Body Recicla Variantes
- description = Body por tallas
- genre = unisex
- price = 29.99
- variants = [{"size":"RN","stock":"2"},{"size":"3M","stock":"5"}]

Respuesta ejemplo
{
"id": "p1",
"name": "Body Recicla Variantes",
"description": "Body por tallas",
"genre": "unisex",
"price": 29.99,
"variants": [
{ "size": "RN", "stock": 2 },
{ "size": "3M", "stock": 5 }
],
"imageUrl": "https://...",
"status": "disponible",
"createdAt": "2025-10-12T...",
"updatedAt": "2025-10-12T..."
}

### PUT /products/:id — Actualizar producto (multipart)

- Consumes: multipart/form-data
- Ruta: /products/:id
- Campos (opcionales)
  - file?: binary
  - name?: string
  - description?: string
  - genre?: string (enum Genre)
  - price?: string (hasta 2 decimales)
  - variants?: si se envía, REEMPLAZA el arreglo completo
- Comportamiento
  - Si variants total == 0 → status: "agotado" (si no se envió status explícito)
  - Si variants total > 0 y venía de "agotado" → "disponible"
- Respuesta 200: Product
- Errores 400/404 según validación/id

### PATCH /products/:id/variants — Ajustar stock por talla

- Body (uno de los dos):
  - { size: Size, stock: number } → set absoluto
  - { size: Size, stockDelta: number } → ajuste incremental (puede ser negativo, nunca deja stock < 0)
- Reglas: valida talla (enum Size) y stock no negativo
- Efecto en status: si total stock queda 0 → "agotado"; si sube de 0 y venía de "agotado" → "disponible" (si no está eliminado)
- Respuesta 200: Product

### PATCH /products/:id/details — Actualizar datos generales

- Body (opcionales): { name?, description?, genre?, price?, status? }
- price validado (>= 0)
- status puede cambiarse manualmente (excepto cuando el producto esté siendo restaurado por endpoint dedicado)
- Respuesta 200: Product

### DELETE /products/:id — Soft delete

- Marca el producto como "eliminado"
- No modifica variants ni imagen
- Respuesta 200: Product (status = "eliminado")

### PATCH /products/:id/restore — Restaurar un producto eliminado

- Body: { status: 'disponible' | 'agotado' }
- No se permite restaurar con estado 'eliminado'
- Respuesta 200: Product

### DELETE /products/:id/hard — Eliminación definitiva

- Borra el documento del producto
- Respuesta 200: Product (el que fue eliminado)

## GraphQL

- GraphQL es de solo lectura (read-only) para Products. Las escrituras (crear/actualizar/soft-delete/restore) se hacen por REST.
- Consultas disponibles: `products(input)` (público), `adminProducts(input)` (admin), `product(id)` (detalle).
- ProductType expone `variants` (no existen size/stock legacy).

Filtros (resumen)

- name?: string (regex, i)
- minPrice/maxPrice?: number
- genre?: Genre
- sizes?: Size[] (filtra por `variants.size`)
- status?: ProductStatus (solo admin)
- Público: fuerza `status=disponible` y `variants: { $elemMatch: { stock: { $gt: 0 } } }`

Ejemplo query (admin)

```
query Products($input: ProductsQueryInput) {
  adminProducts(input: $input) {
    items { id name genre status variants { size stock } }
    total
    page
    totalPages
  }
}
```

Variables:

```
{
  "input": {
    "filters": { "genre": "NINO", "sizes": ["RN"] },
    "pagination": { "page": 1, "limit": 10 }
  }
}
```

Ejemplo query (público)

```
query PublicProducts($input: ProductsQueryInput) {
  products(input: $input) {
    items { id name price variants { size stock } }
    total
    page
    totalPages
  }
}
```

Variables:

```
{
  "input": {
    "filters": { "name": "body" },
    "pagination": { "page": 1, "limit": 12 }
  }
}
```

Detalle por id

```
query ProductById($id: String!) {
  product(id: $id) {
    id
    name
    description
    genre
    price
    status
    variants { size stock }
    imageUrl
  }
}
```

Variables:

```
{ "id": "<PRODUCT_ID>" }
```

Nota: No hay mutaciones GraphQL para crear/actualizar/eliminar/restaurar productos.

## Manejo de imágenes

- El backend guarda las URLs/IDs recibidos, pero no gestiona subida ni borrado de archivos externos.
- Tipos y tamaños permitidos dependen del cliente o servicio que realice la subida.

## Errores y formato

Estructura típica (REST)

```
{
  "statusCode": 400,
  "timestamp": "2025-10-12T12:00:00.000Z",
  "message": "Mensaje de error"
}
```

## Ejemplos rápidos

- Crear con imagen y variants (JSON en multipart)
- Actualizar nombre y precio
- Reemplazar variants a 0 → pasa a "agotado"

## Cambios importantes

- Eliminados size/stock a nivel raíz.
- Sustituido filtro legacy por `variants.$elemMatch`.
- Tests y Swagger alineados a variants-only.

## Próximos pasos (opcional)

- Endpoints de ajuste de stock por talla (PATCH).
- Más ejemplos Swagger con variants anidados.
- README con el nuevo contrato.

```

```
````
