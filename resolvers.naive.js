// Provoca el problema N+1
import { db } from './database.js';

export const resolvers = {
  Query: {
    clientes: () => db.fetchAllClientes(),
    cliente: async (_, { id }) =>
      (await db.fetchAllClientes()).find(c => c.id === id) ?? null,
  },
  Cliente: {
    // Se ejecuta una vez POR CADA cliente -> N consultas extra
    facturas: (parent) => db.fetchFacturasByClienteId(parent.id),
  },
  Factura: {
    cliente: async (parent) =>
      (await db.fetchAllClientes()).find(c => c.id === parent.clienteId),
  },
};