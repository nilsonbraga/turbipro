import dotenv from 'dotenv';

dotenv.config();

const parsedPort = process.env.PORT ? Number(process.env.PORT) : undefined;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.isFinite(parsedPort) ? Number(parsedPort) : 3001,
  databaseUrl: process.env.DATABASE_URL,
  shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL não configurada no ambiente (.env)');
}
