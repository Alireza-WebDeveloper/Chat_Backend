import { ApolloServer } from '@apollo/server';
import { expressMiddleware as apolloMiddleware } from '@apollo/server/express4';
import { resolvers } from './graphql/resolves.js';
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
const Port = process.env.PORT || 8000;
import app from './app.js';

// Connection MongoDb
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDb Connected'));
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
});
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});

// Connection Apollo Server
const typeDefs = await readFile('./graphql/typeDefs.graphql', 'utf-8');
const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();
app.use(
  '/graphql',
  apolloMiddleware(apolloServer, {
    context: ({ req, res }) => {
      if (req.auth) {
        // const user  = await ...
        return { user };
      }
      return { user: false };
    },
  })
);

app.listen('8000', () => {
  console.log(`server is running on port ${Port}`);
  console.log(`graphql endpoint http://localhost:8000/graphql`);
});
