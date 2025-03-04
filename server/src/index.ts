import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import { UserResolver } from './resolvers/UserResolver';
import { BoardResolver } from './resolvers/BoardResolver';
import { ItemResolver } from './resolvers/ItemResolver';
import { GroupResolver } from './resolvers/GroupResolver';
import { ColumnResolver } from './resolvers/ColumnResolver';
import { authMiddleware } from './middleware/auth';

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/work-management';

async function bootstrap() {
  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  // Create Express app
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(authMiddleware);

  // Read GraphQL schema
  const typeDefs = readFileSync(join(__dirname, 'schema/schema.graphql'), 'utf-8');

  // Build GraphQL schema
  const schema = await buildSchema({
    resolvers: [
      UserResolver,
      BoardResolver,
      ItemResolver,
      GroupResolver,
      ColumnResolver,
    ],
    emitSchemaFile: join(__dirname, 'schema/schema.gql'),
  });

  // Create executable schema for subscriptions
  const executableSchema = makeExecutableSchema({
    typeDefs,
    resolvers: schema.getResolvers(),
  });

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ req }),
    playground: true,
    introspection: true,
  });

  // Apply middleware
  server.applyMiddleware({ app });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create Subscription Server
  const subscriptionServer = SubscriptionServer.create(
    {
      schema: executableSchema,
      execute,
      subscribe,
    },
    {
      server: httpServer,
      path: server.graphqlPath,
    }
  );

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Subscriptions are ready on ws://localhost:${PORT}${server.graphqlPath}`);
  });
}

bootstrap().catch(console.error); 