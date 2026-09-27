// SOLUCIÓN OPTIMIZADA: DataLoader (batching + caché por petición)
import { db } from './database.js';

export const resolvers = {
  Query: {
    clientes: () => db.fetchAllClientes(),
    cliente: async (_, { id }) =>
      (await db.fetchAllClientes()).find(c => c.id === id) ?? null,
  },
  Cliente: {
    // Ya no consulta la BD: encola el id en el loader del contexto
    facturas: (parent, _args, { loaders }) =>
      loaders.facturasPorCliente.load(parent.id),
  },
  Factura: {
    cliente: async (parent) =>
      (await db.fetchAllClientes()).find(c => c.id === parent.clienteId),
  },
};