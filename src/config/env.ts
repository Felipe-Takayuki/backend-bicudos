import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    POSTGRES_USER: z.string().default('postgres'),
    POSTGRES_PASSWORD: z.string().default('postgrespassword'),
    POSTGRES_DB: z.string().default('monitoramento_pragas'),
    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z.coerce.number().default(5432),
    DATABASE_URL: z.string().optional(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres para garantir segurança criptográfica'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().default(30),
    CORS_ORIGIN: z.string().default('*'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutos
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10), // Máximo de 10 tentativas de login/registro a cada 15 min
  })
  .transform((data) => {
    const databaseUrl =
      data.DATABASE_URL ||
      `postgresql://${data.POSTGRES_USER}:${data.POSTGRES_PASSWORD}@${data.POSTGRES_HOST}:${data.POSTGRES_PORT}/${data.POSTGRES_DB}?schema=public`;

    process.env.DATABASE_URL = databaseUrl;

    return {
      ...data,
      DATABASE_URL: databaseUrl,
    };
  });

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração inválida nas variáveis de ambiente:');
  console.error(JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
