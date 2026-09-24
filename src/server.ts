import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌱 API de Monitoramento de Pragas iniciada com sucesso!`);
  console.log(`📡 URL Base:        http://localhost:${env.PORT}`);
  console.log(`📖 Documentação:    http://localhost:${env.PORT}/api/v1/docs`);
  console.log(`🩺 Healthcheck:     http://localhost:${env.PORT}/health`);
  console.log(`🔒 Ambiente:        ${env.NODE_ENV}`);
  console.log(`======================================================\n`);
});

// Tratamento de Encerramento Gracioso (Graceful Shutdown)
const gracefulShutdown = async (signal: string) => {
  console.log(`\nRecebido sinal ${signal}. Encerrando aplicação graciosamente...`);

  server.close(async () => {
    console.log('Servidor HTTP encerrado.');
    try {
      await prisma.$disconnect();
      console.log('Conexões com o banco de dados encerradas.');
      process.exit(0);
    } catch (err) {
      console.error('Erro ao desconectar do banco de dados:', err);
      process.exit(1);
    }
  });

  // Força encerramento após 10 segundos caso conexões fiquem pendentes
  setTimeout(() => {
    console.error('Forçando encerramento após tempo limite de espera (10s).');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
