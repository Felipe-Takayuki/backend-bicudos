import { z } from 'zod';

export const createPestRecordSchema = z.object({
  id: z
    .string()
    .uuid('ID deve ser um UUID válido')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val && val.trim() !== '' ? val : undefined)),
  pestName: z
    .string()
    .trim()
    .transform((val) => (!val ? 'Bicudo' : val))
    .pipe(z.string().min(2, 'Nome da praga deve ter no mínimo 2 caracteres').max(120))
    .default('Bicudo'),
  quantity: z.coerce.number().int().min(1, 'A quantidade deve ser de no mínimo 1 indivíduo'),
  crop: z.string().trim().max(100).optional().default(''),
  plot: z.string().trim().max(100).optional().default(''),
  growthStage: z.string().trim().max(100).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
  latitude: z.coerce.number().min(-90, 'Latitude deve estar entre -90 e 90').max(90, 'Latitude deve estar entre -90 e 90'),
  longitude: z.coerce.number().min(-180, 'Longitude deve estar entre -180 e 180').max(180, 'Longitude deve estar entre -180 e 180'),
  altitude: z.coerce.number().optional().nullable(),
  accuracy: z.coerce
    .number()
    .optional()
    .nullable()
    .transform((val) => (val != null && val >= 0 ? val : null)),
  imagePath: z.string().trim().optional().nullable(),
  createdAt: z
    .union([
      z.string().datetime({ offset: true }),
      z.string().datetime(),
      z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Data inválida' }),
      z.date(),
    ])
    .optional()
    .nullable(),
});

export const updatePestRecordSchema = z.object({
  pestName: z.string().trim().min(2).max(120).optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  crop: z.string().trim().max(100).optional(),
  plot: z.string().trim().max(100).optional(),
  growthStage: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  altitude: z.coerce.number().optional().nullable(),
  accuracy: z.coerce.number().min(0).optional().nullable(),
  imagePath: z.string().trim().optional().nullable(),
});

export const pestRecordQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(20),
  pestName: z.string().trim().optional(),
  crop: z.string().trim().optional(),
  plot: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minQuantity: z.coerce.number().int().optional(),
});

export const nearbyQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(10).max(100000).optional().default(5000), // metros (padrão 5 km)
  pestName: z.string().trim().optional(),
});

export const syncPestRecordsSchema = z.object({
  records: z.array(createPestRecordSchema).min(1, 'A lista de sincronização deve conter pelo menos 1 registro'),
});

export const pestRecordIdParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export type CreatePestRecordInput = z.infer<typeof createPestRecordSchema>;
export type UpdatePestRecordInput = z.infer<typeof updatePestRecordSchema>;
export type PestRecordQuery = z.infer<typeof pestRecordQuerySchema>;
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
export type SyncPestRecordsInput = z.infer<typeof syncPestRecordsSchema>;
