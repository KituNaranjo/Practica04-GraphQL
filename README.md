# Práctica 04 – GraphQL: Problema N+1 y DataLoader

API GraphQL construida con **Apollo Server** que demuestra el problema **N+1** en los resolvers y su solución mediante **DataLoader** (batching + caché por petición).

## Tecnologías

- Node.js (ES Modules)
- [@apollo/server](https://www.apollographql.com/docs/apollo-server/) 5
- [graphql](https://www.npmjs.com/package/graphql) 16
- [dataloader](https://github.com/graphql/dataloader) 2

## Estructura del proyecto

| Archivo | Descripción |
|---|---|
| `schema.graphql` | Esquema: tipos `Cliente`, `Factura`, enum `EstadoFactura` y las queries `clientes` y `cliente(id)`. |
| `database.js` | Base de datos simulada en memoria con 200 ms de latencia por consulta. Registra en consola cada lectura. |
| `resolvers.naive.js` | Resolvers **ingenuos**: `Cliente.facturas` consulta la BD una vez por cada cliente (provoca N+1). |
| `resolvers.js` | Resolvers **optimizados**: `Cliente.facturas` usa el DataLoader del contexto. |
| `dataloaders.js` | Batch function y `createLoaders()`, que crea un DataLoader nuevo por petición. |
| `server.js` | Levanta el servidor en el puerto 4000 en modo `ingenuo` u `optimizado`. |

## Esquema

```graphql
type Cliente {
  id: ID!
  nombre: String!
  sector: String!
  facturas: [Factura!]!
}

type Factura {
  id: ID!
  monto: Float!
  estado: EstadoFactura!
  cliente: Cliente!
}

enum EstadoFactura { PAGADA PENDIENTE ANULADA }

type Query {
  clientes: [Cliente!]!
  cliente(id: ID!): Cliente
}
```

## Instalación y ejecución

```bash
npm install

# Modo optimizado (DataLoader)
npm start

# Modo ingenuo (problema N+1)
npm run start:ingenuo
```

El servidor queda disponible en `http://localhost:4000/`, donde se puede usar Apollo Sandbox para ejecutar consultas.

## Consulta de prueba

```graphql
query {
  clientes {
    nombre
    sector
    facturas {
      id
      monto
      estado
    }
  }
}
```

## Resultados

### Modo ingenuo: problema N+1

Se ejecuta 1 consulta para obtener los clientes y luego **1 consulta por cada cliente** para sus facturas:

```
[DB READ] SELECT * FROM clientes;
[DB READ] SELECT * FROM facturas WHERE cliente_id = 'c-1';
[DB READ] SELECT * FROM facturas WHERE cliente_id = 'c-2';
[DB READ] SELECT * FROM facturas WHERE cliente_id = 'c-3';
[DB READ] SELECT * FROM facturas WHERE cliente_id = 'c-4';
[DB READ] SELECT * FROM facturas WHERE cliente_id = 'c-5';
```

Con 5 clientes se hacen **6 viajes a la BD** (1 + N).

### Modo optimizado: DataLoader

DataLoader agrupa todas las llamadas a `load(id)` del mismo ciclo y ejecuta **una sola consulta por lotes**:

```
[DB READ] SELECT * FROM clientes;
[DB BATCH READ] SELECT * FROM facturas WHERE cliente_id IN ('c-1', 'c-2', 'c-3', 'c-4', 'c-5');
```

Se reduce a **2 viajes a la BD**, sin importar cuántos clientes haya.

## Puntos clave de la implementación

- **Batching:** `batchFacturasPorCliente` recibe todos los ids juntos y hace una sola consulta.
- **Orden de resultados:** la batch function devuelve un arreglo en el mismo orden que los ids recibidos, como exige DataLoader.
- **Clientes sin facturas:** se devuelve `[]` en lugar de `undefined` (por ejemplo, `c-5`).
- **Caché por petición:** los loaders se crean en el `context` de Apollo en cada request, así la caché no se comparte entre usuarios ni queda con datos obsoletos.
