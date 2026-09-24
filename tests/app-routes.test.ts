import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('HTTP Endpoints & Security Headers', () => {
  it('GET /health should return service status', async () => {
    const res = await request(app).get('/health');
    // Pode ser 200 se DB conectado ou 503 degraded se DB offline no teste
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET / should return api information', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Monitoramento de Pragas API');
    expect(res.body.documentation).toBe('/api/v1/docs');
  });

  it('POST /api/v1/auth/register with empty body should return 400 with validation errors', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('POST /api/v1/pest-records/sync without token should return 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/pest-records/sync')
      .send({ records: [] });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  it('GET /non-existent-route should return 404 with standard error format', async () => {
    const res = await request(app).get('/random-unknown-endpoint-1234');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should include Helmet security headers in responses', async () => {
    const res = await request(app).get('/');
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
  });
});
