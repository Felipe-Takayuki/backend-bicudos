import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const user = process.env.POSTGRES_USER || 'postgres';
const pass = process.env.POSTGRES_PASSWORD || 'postgrespassword';
const db = process.env.POSTGRES_DB || 'monitoramento_pragas';
const host = process.env.POSTGRES_HOST || 'localhost';
const port = process.env.POSTGRES_PORT || '5432';

const computedUrl = `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL || computedUrl,
  },
});
