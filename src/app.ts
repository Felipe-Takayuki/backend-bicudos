import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { globalRateLimiter } from './core/middlewares/rate-limiter.middleware';
import { errorHandler } from './core/middlewares/error.middleware';
import { NotFoundError } from './core/errors/app-error';
import { authRouter } from './modules/auth/auth.routes';
import { pestRecordsRouter } from './modules/pest-records/pest-records.routes';
import { statisticsRouter } from './modules/statistics/statistics.routes';
import swaggerDocument from './modules/docs/swagger.json';

const app: Application = express();

// 1. Segurança com Headers HTTP (Helmet)
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Logger de Requisições HTTP
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// 4. Body Parsers com limites adequados
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Rate Limiter Global para mitigar DoS
app.use('/api', globalRateLimiter);

// 6. Documentação Swagger UI Interativa
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 7. Healthcheck com verificação de conectividade do banco
app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    },
  });
});

// 8. Rotas da API v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/pest-records', pestRecordsRouter);
app.use('/api/v1/statistics', statisticsRouter);

// 9. Rota padrão de redirecionamento ou boas-vindas
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Monitoramento de Pragas API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    health: '/health',
  });
});

// 10. Tratamento de rotas inexistentes (404)
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`A rota ${req.method} ${req.originalUrl} não foi encontrada neste servidor`));
});

// 11. Middleware Central de Tratamento de Erros
app.use(errorHandler);

export { app };
