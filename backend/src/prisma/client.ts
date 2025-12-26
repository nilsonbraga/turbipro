import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

export const prisma = new PrismaClient({
  datasources: {
    db: { url: env.databaseUrl },
  },
  log: env.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

process.once('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.once('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
