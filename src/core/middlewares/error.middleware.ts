import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { env } from '../../config/env';

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Erros conhecidos da aplicação (AppError e subclasses)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
    });
    return;
  }

  // Erros conhecidos do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'campo único';
      res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `Já existe um registro com este valor em: ${target}`,
          details: error.meta,
        },
      });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Registro não encontrado no banco de dados',
          details: null,
        },
      });
      return;
    }
  }

  // Erros de parsing JSON malformado do body-parser
  if (error instanceof SyntaxError && 'status' in error && (error as any).status === 400) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON_BODY',
        message: 'O corpo da requisição contém JSON inválido',
        details: null,
      },
    });
    return;
  }

  // Erro não tratado (500)
  console.error('💥 Erro não tratado:', error);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocorreu um erro interno no servidor',
      details: env.NODE_ENV === 'development' ? error.stack : null,
    },
  });
};
