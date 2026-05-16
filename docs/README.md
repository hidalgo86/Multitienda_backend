# Documentación de APIs y Esquema

Este directorio contiene recursos de documentación para REST y GraphQL.

- Swagger (REST):
  - Disponible en tiempo de ejecución en /api (solo no-producción).
  - Configuración en `src/main.ts` (DocumentBuilder + SwaggerModule).
- GraphQL (Apollo Sandbox):
  - Disponible cuando levantas el servidor (GraphQLModule con Apollo Driver) e incluye ejemplos iniciales para probar.
  - El esquema SDL se exporta automáticamente a `docs/schema.graphql` (ver `AppModule`).
- Products (guía funcional):
  - `docs/products-notion.md` contiene guía completa variants-only (modelos, REST, GraphQL, ejemplos y consideraciones).

## Ejemplo rápido: actualizar precio por talla (REST)

- Endpoint: `PATCH /products/:id/variants/price`
- Body JSON:

```
{ "size": "RN", "price": "25.00" }
```

Respuesta 200 (fragmento):

```
{
  "id": "...",
  "variants": [
    { "size": "RN", "stock": 3, "price": 25 },
    { "size": "3M", "stock": 2, "price": 21.5 }
  ],
  "status": "disponible"
}
```

### cURL (bash)

```
curl -X PATCH \
  "http://localhost:3001/products/<PRODUCT_ID>/variants/price" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{ "size": "RN", "price": "25.00" }'
```

### PowerShell (Invoke-RestMethod)

```
$headers = @{ "Authorization" = "Bearer <ACCESS_TOKEN>" }
$body = @{ size = "RN"; price = "25.00" } | ConvertTo-Json
Invoke-RestMethod -Method Patch `
  -Uri "http://localhost:3001/products/<PRODUCT_ID>/variants/price" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

### Axios (Node.js)

```js
import axios from 'axios';

await axios.patch(
  'http://localhost:3001/products/<PRODUCT_ID>/variants/price',
  { size: 'RN', price: '25.00' },
  { headers: { Authorization: `Bearer ${accessToken}` } },
);
```

## Cómo abrir

- Swagger UI (REST): abre `http://localhost:<PORT>/api`.
- Apollo Sandbox (GraphQL): abre `http://localhost:<PORT>/graphql`.

Reemplaza `<PORT>` por el puerto configurado en `PORT` (.env) o el default 3001.
