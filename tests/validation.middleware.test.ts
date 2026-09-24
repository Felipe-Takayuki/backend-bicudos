import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validateRequest } from '../src/core/middlewares/validation.middleware';
import { errorHandler } from '../src/core/middlewares/error.middleware';

describe('Validation Middleware (Express 5 Compatibility)', () => {
  const querySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(20),
    pestName: z.string().optional(),
  });

  const paramsSchema = z.object({
    id: z.string().uuid(),
  });

  const bodySchema = z.object({
    quantity: z.number().int().min(1),
  });

  const createApp = () => {
    const testApp = express();
    testApp.use(express.json());

    testApp.get('/test-query', validateRequest({ query: querySchema }), (req, res) => {
      res.json({ query: req.query });
    });

    testApp.get('/test-params/:id', validateRequest({ params: paramsSchema }), (req, res) => {
      res.json({ params: req.params });
    });

    testApp.post('/test-body', validateRequest({ body: bodySchema }), (req, res) => {
      res.json({ body: req.body });
    });

    testApp.use(errorHandler);
    return testApp;
  };

  it('should parse and coerce query params successfully without getter error', async () => {
    const app = createApp();
    const res = await request(app).get('/test-query?limit=200&pestName=Bicudo');

    expect(res.status).toBe(200);
    expect(res.body.query).toEqual({ limit: 200, pestName: 'Bicudo' });
  });

  it('should validate and parse params successfully', async () => {
    const app = createApp();
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const res = await request(app).get(`/test-params/${validUuid}`);

    expect(res.status).toBe(200);
    expect(res.body.params.id).toBe(validUuid);
  });

  it('should return 400 when query validation fails', async () => {
    const app = createApp();
    const res = await request(app).get('/test-query?limit=999');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when body validation fails', async () => {
    const app = createApp();
    const res = await request(app).post('/test-body').send({ quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
