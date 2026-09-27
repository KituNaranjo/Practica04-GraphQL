import DataLoader from 'dataloader';
import { db } from './database.js';

// Batch Function, recibe todos los ids juntos y hace UNA sola consulta
export async function batchFacturasPorCliente(clienteIds) {
  const resultados = await db.fetchFacturasByClienteIdsBatch(clienteIds);
  // Cliente sin facturas -> [] (nunca undefined)
  return clienteIds.map((_, i) => resultados[i] ?? []);
}

// Se llama por pertición, así la caché no se comparte entre usuarios
export function createLoaders() {
  return {
    facturasPorCliente: new DataLoader(batchFacturasPorCliente),
  };
}