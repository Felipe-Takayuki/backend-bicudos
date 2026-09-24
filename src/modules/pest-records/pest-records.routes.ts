import { Router } from 'express';
import { PestRecordController } from './controllers/pest-record.controller';
import { validateRequest } from '../../core/middlewares/validation.middleware';
import { authenticate, optionalAuth } from '../../core/middlewares/auth.middleware';
import {
  createPestRecordSchema,
  updatePestRecordSchema,
  pestRecordQuerySchema,
  nearbyQuerySchema,
  syncPestRecordsSchema,
  pestRecordIdParamSchema,
} from './schemas/pest-record.schema';

const pestRecordsRouter = Router();
const controller = new PestRecordController();

// Rotas de Busca Espacial e Exportação (antes de /:id para não colidir com parâmetros de rota)
pestRecordsRouter.get(
  '/nearby',
  optionalAuth,
  validateRequest({ query: nearbyQuerySchema }),
  controller.findNearby
);

pestRecordsRouter.get(
  '/export/geojson',
  optionalAuth,
  validateRequest({ query: pestRecordQuerySchema }),
  controller.exportGeoJson
);

pestRecordsRouter.get(
  '/export/csv',
  optionalAuth,
  validateRequest({ query: pestRecordQuerySchema }),
  controller.exportCsv
);

// Sincronização em lote Offline-First
pestRecordsRouter.post(
  '/sync',
  authenticate,
  validateRequest({ body: syncPestRecordsSchema }),
  controller.sync
);

// CRUD Padrão
pestRecordsRouter.post(
  '/',
  authenticate,
  validateRequest({ body: createPestRecordSchema }),
  controller.create
);

pestRecordsRouter.get(
  '/',
  optionalAuth,
  validateRequest({ query: pestRecordQuerySchema }),
  controller.findMany
);

pestRecordsRouter.get(
  '/:id',
  optionalAuth,
  validateRequest({ params: pestRecordIdParamSchema }),
  controller.findById
);

pestRecordsRouter.put(
  '/:id',
  authenticate,
  validateRequest({ params: pestRecordIdParamSchema, body: updatePestRecordSchema }),
  controller.update
);

pestRecordsRouter.delete(
  '/:id',
  authenticate,
  validateRequest({ params: pestRecordIdParamSchema }),
  controller.delete
);

export { pestRecordsRouter };
