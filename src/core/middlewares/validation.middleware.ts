import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../errors/app-error';

interface RequestValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateRequest = (schemas: RequestValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        const parsedQuery = (await schemas.query.parseAsync(req.query)) as any;
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (schemas.params) {
        const parsedParams = (await schemas.params.parseAsync(req.params)) as any;
        Object.defineProperty(req, 'params', {
          value: parsedParams,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error.issues ?? []).map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        next(new BadRequestError('Erro de validação nos dados fornecidos', 'VALIDATION_ERROR', issues));
        return;
      }
      next(error);
    }
  };
};
