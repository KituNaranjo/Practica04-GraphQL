import { readFileSync } from 'node:fs';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createLoaders } from './dataloaders.js';

// Elegir modo: "node server.js ingenuo" o "node server.js optimizado"
const modo = process.argv[2] === 'ingenuo' ? 'ingenuo' : 'optimizado';
const { resolvers } = await import(
  modo === 'ingenuo' ? './resolvers.naive.js' : './resolvers.js'
);

const typeDefs = readFileSync(new URL('./schema.graphql', import.meta.url), 'utf8');

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  // DataLoader creado AQUÍ: uno nuevo por cada petición (nunca global)
  context: async () => ({ loaders: createLoaders() }),
});

console.log(`🚀 Servidor Académico listo en: ${url}  (modo: ${modo.toUpperCase()})`);