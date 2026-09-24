import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../../config/env';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { UserPayload } from '../types/express';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next(new UnauthorizedError('Token de autenticação não fornecido', 'TOKEN_MISSING'));
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next(new UnauthorizedError('Formato de token inválido. Esperado: Bearer <token>', 'TOKEN_MALFORMATTED'));
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expirado', 'TOKEN_EXPIRED'));
      return;
    }
    next(new UnauthorizedError('Token inválido ou corrompido', 'TOKEN_INVALID'));
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      const decoded = jwt.verify(parts[1], env.JWT_SECRET) as UserPayload;
      req.user = decoded;
    } catch {
      // Ignora erro se for opcional
    }
  }
  next();
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Usuário não autenticado', 'UNAUTHORIZED'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Você não tem permissão para acessar este recurso', 'INSUFFICIENT_PERMISSIONS'));
      return;
    }

    next();
  };
};
