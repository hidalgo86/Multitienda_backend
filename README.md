<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Guía rápida de API

- **API REST (multipart):** ver [API Productos (REST) — multipart/form-data](#api-rest-multipart).
- **Reglas de negocio y validaciones:** ver [Regla de negocio: stock vs tallas](#regla-stock-tallas) y [Cheat sheet de validaciones](#validaciones-cheatsheet). Los mensajes de error ahora son descriptivos y coherentes, por ejemplo: "La talla debe ser una de: ...", "El stock debe ser un entero no negativo", "El precio debe ser un número válido mayor o igual a cero y con hasta 2 decimales".
- **Variants:** fuente de verdad para inventario y precio. El campo `variants` es obligatorio en creación y opcional en actualización (si se envía, reemplaza todo el arreglo). Cada variante requiere `size`, `stock` y `price`.
- **Enums REST ↔ GraphQL:** ver [Enums válidos (REST vs GraphQL)](#enums-mapeo). REST usa strings, GraphQL usa tokens del enum (mayúsculas).
- **Errores típicos 400:** ver [Errores comunes (400 Bad Request)](#errores-400). Los mensajes de validación son claros y alineados con la lógica de negocio.
- **GraphQL:** solo consultas (read-only) para Products, con filtros, paginación y ordenamiento. No existen mutaciones para crear/actualizar/eliminar productos.
- **Swagger UI:** http://localhost:3000/api

## Auditoria y privacidad

- Las auditorias guardan solo IP anonimizada: IPv4 con el ultimo octeto a `0` e IPv6 truncada.
- Las auditorias se eliminan automaticamente mediante indice TTL de MongoDB.
- Configura `AUDIT_LOG_RETENTION_DAYS` para cambiar la retencion; si no se define, se conservan 180 dias.
- Estos logs deben usarse solo para seguridad, trazabilidad y soporte operativo.

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

<a id="api-rest-multipart"></a>

## API Productos (REST) — multipart/form-data

Los endpoints de productos usan `multipart/form-data` para crear y actualizar productos, aceptando opcionalmente un archivo de imagen en el campo `file` (JPEG/PNG/WebP hasta 5MB). Ruta base: `http://localhost:3000/products`.

**Importante:**

- El campo `variants` (arreglo de objetos `{ size, stock, price }`) es la fuente de verdad para inventario y precio. Ya no existen los campos legacy `size` ni `stock` a nivel raíz del producto.
- En creación, `variants` es obligatorio y debe ser un arreglo no vacío. En actualización, es opcional; si se envía, reemplaza todo el arreglo.
- El stock total del producto se calcula como la suma de los stocks por talla (`variants[].stock`).
- Los mensajes de error de validación son descriptivos y coherentes con la lógica de negocio.

**Autenticación:** Si el endpoint requiere autenticación, añade el encabezado `Authorization: Bearer <token>`.

### Crear producto

Ejemplo recomendado (con variants):

```powershell
curl.exe -X POST "http://localhost:3000/products" \
  -F "name=Body Recicla Variantes" \
  -F "description=Body por tallas" \
  -F "genre=unisex" \
  -F "variants=[{\"size\":\"RN\",\"stock\":\"2\",\"price\":\"19.99\"},{\"size\":\"3M\",\"stock\":\"5\",\"price\":\"21.50\"}]"
```

Respuesta ejemplo:

```json
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
```

Windows PowerShell (Invoke-WebRequest):

```powershell
$Form = @{
  name        = 'Body Recicla'
  description = 'Body ecológico'
  genre       = 'niño'
  size        = 'RN,3M'
  price       = '29.99'
  stock       = '10'
}
Invoke-WebRequest -Uri 'http://localhost:3000/products' -Method Post -Form $Form

# Con imagen
$Form = @{
  file        = Get-Item 'C:\Users\USUARIO\Pictures\body.jpg'
  name        = 'Body Recicla'
  description = 'Body ecológico'
  genre       = 'niño'
  size        = 'RN,3M'
  price       = '29.99'
  stock       = '10'
}
Invoke-WebRequest -Uri 'http://localhost:3000/products' -Method Post -Form $Form

# Con variants (recomendado)
$Form = @{
  name     = 'Body por tallas'
  genre    = 'unisex'
  variants = '[{"size":"RN","stock":"2"},{"size":"3M","stock":"5"}]'
  price    = '29.99'
}
Invoke-WebRequest -Uri 'http://localhost:3000/products' -Method Post -Form $Form
```

### Actualizar producto

Ejemplo para reemplazar variants:

```powershell
curl.exe -X PUT "http://localhost:3000/products/<ID>" \
  -F "variants=[{\"size\":\"RN\",\"stock\":\"1\",\"price\":\"19.99\"},{\"size\":\"3M\",\"stock\":\"0\",\"price\":\"21.50\"}]"
```

Si el arreglo de variants queda vacío o con stock total 0, el producto pasa a estado "agotado" automáticamente (si no se envió status explícito).

Windows PowerShell (Invoke-WebRequest):

```powershell
$Form = @{ stock = '5' }
Invoke-WebRequest -Uri 'http://localhost:3000/products/<ID>' -Method Put -Form $Form

$Form = @{
  file  = Get-Item 'C:\Users\USUARIO\Pictures\body2.webp'
  name  = 'Body Recicla v2'
  price = '34.50'
  stock = '12'
}
Invoke-WebRequest -Uri 'http://localhost:3000/products/<ID>' -Method Put -Form $Form

# Reemplazar variants
$Form = @{
  variants = '[{"size":"RN","stock":"1"},{"size":"3M","stock":"0"}]'
}
Invoke-WebRequest -Uri 'http://localhost:3000/products/<ID>' -Method Put -Form $Form
```

<a id="rest-delete-restore"></a>

### Borrado y restauración (REST)

Soft delete (marca como "eliminado"):

```powershell
curl.exe -X DELETE "http://localhost:3000/products/<ID>"
```

Restaurar (estado debe ser `disponible` o `agotado`):

```powershell
curl.exe -X PATCH "http://localhost:3000/products/<ID>/restore" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"disponible\"}"
```

Borrado definitivo (hard delete):

```powershell
curl.exe -X DELETE "http://localhost:3000/products/<ID>/hard"
```

Notas:

- Soft delete no elimina variantes ni imagen; solo cambia `status` a `eliminado`.
- Hard delete elimina el documento del producto.
- Si tus endpoints requieren autenticación, añade `-H "Authorization: Bearer <token>"`.

<a id="regla-stock-tallas"></a>

## Regla de negocio: stock vs tallas

- El stock total del producto es la suma de los stocks por talla (`variants[].stock`).
- Si el stock total es 0, el producto queda en estado "agotado".
- Si el stock total es mayor a 0, el producto queda en estado "disponible".
- En creación, `variants` debe ser un arreglo no vacío; en actualización, si se envía, reemplaza todo el arreglo.

<a id="errores-400"></a>

## Errores comunes (400 Bad Request)

Los mensajes de error de validación son claros y alineados con la lógica de negocio. Ejemplos:

- "La talla debe ser una de: RN, 3M, 6M, ..."
- "El stock debe ser un entero no negativo"
- "El precio debe ser un número válido mayor o igual a cero y con hasta 2 decimales"
- "El género debe ser uno de: niña, niño, unisex"

<a id="graphql-ejemplos"></a>

## GraphQL — consultas (read-only) para Products

Endpoint GraphQL: `http://localhost:3001/graphql`

- Solo consultas: `product`, `products`, `adminProducts`.
- Filtros disponibles: name, genre, sizes, minPrice, maxPrice, status (solo admin).
- Paginación y ordenamiento: por nombre, fecha de creación, precio mínimo, stock total.
- Los enums se envían como tokens en mayúsculas (ejemplo: `NINO`, `NINA`, `UNISEX`, `DISPONIBLE`, `AGOTADO`, `ELIMINADO`, tallas `RN`, `M3`, ...).
- No existen mutaciones para crear/actualizar/eliminar productos.

<a id="enums-mapeo"></a>

## Enums válidos (REST vs GraphQL)

Al consumir REST envías strings. En GraphQL usas los tokens del enum (sin comillas). Ten en cuenta estos mapeos:

### Genre

| REST (string) | GraphQL (enum) |
| ------------- | -------------- |
| niño          | NINO           |
| niña          | NINA           |
| unisex        | UNISEX         |

### ProductStatus

| REST (string) | GraphQL (enum) |
| ------------- | -------------- |
| disponible    | DISPONIBLE     |
| agotado       | AGOTADO        |
| eliminado     | ELIMINADO      |

### Size

- REST (CSV de strings): RN, 3M, 6M, 9M, 12M, 18M, 24M, 2T, 3T, 4T, 5T, 6T, 7T, 8T, 9T, 10T, 12T
- GraphQL (enum tokens): RN, M3, M6, M9, M12, M18, M24, T2, T3, T4, T5, T6, T7, T8, T9, T10, T12

Mapa útil (REST ➜ GraphQL):

- 3M ➜ M3, 6M ➜ M6, 9M ➜ M9, 12M ➜ M12, 18M ➜ M18, 24M ➜ M24
- 2T ➜ T2, 3T ➜ T3, 4T ➜ T4, 5T ➜ T5, 6T ➜ T6, 7T ➜ T7, 8T ➜ T8, 9T ➜ T9, 10T ➜ T10, 12T ➜ T12

<a id="validaciones-cheatsheet"></a>

## Cheat sheet de validaciones

- **variants:** obligatorio en creación, opcional en actualización. Cada objeto requiere `size`, `stock` y `price`.
- **size:** debe ser uno de los valores permitidos (ver enum Size). Mensaje: "La talla debe ser una de: ..."
- **stock:** string que cumple `^\d+$`, entero no negativo. Mensaje: "El stock debe ser un entero no negativo"
- **price:** string que cumple `^(?:\d+)(?:\.\d{1,2})?$`, número mayor o igual a cero y hasta 2 decimales. Mensaje: "El precio debe ser un número válido mayor o igual a cero y con hasta 2 decimales"
- **genre:** uno de [niña, niño, unisex]. Mensaje: "El género debe ser uno de: niña, niño, unisex"
- **Archivo:** campo `file` opcional en multipart/form-data. MIME permitido: `image/jpeg`, `image/png`, `image/webp`. Tamaño máximo: `5 MB`

## Deployment

Consulta la [documentación oficial de NestJS](https://docs.nestjs.com/deployment) para recomendaciones de despliegue.

## Recursos

- [NestJS Documentation](https://docs.nestjs.com)
- [Discord channel](https://discord.gg/G7Qnnhy)
- [Cursos oficiales](https://courses.nestjs.com)
- [NestJS Devtools](https://devtools.nestjs.com)
- [Enterprise support](https://enterprise.nestjs.com)
- [X](https://x.com/nestframework) y [LinkedIn](https://linkedin.com/company/nestjs)

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
