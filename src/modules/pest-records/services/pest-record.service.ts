import crypto from 'crypto';
import { PestRecordRepository, NearbyPestRecord } from '../repositories/pest-record.repository';
import {
  CreatePestRecordInput,
  UpdatePestRecordInput,
  PestRecordQuery,
  NearbyQuery,
  SyncPestRecordsInput,
} from '../schemas/pest-record.schema';
import { NotFoundError, ForbiddenError } from '../../../core/errors/app-error';
import { PestRecord, Role } from '@prisma/client';
import { formatRecordsToFeatureCollection, GeoJsonFeatureCollection } from '../../../utils/geojson';
import { formatRecordsToCsv } from '../../../utils/csv';

export class PestRecordService {
  constructor(private readonly repository: PestRecordRepository = new PestRecordRepository()) {}

  async create(input: CreatePestRecordInput, userId?: string): Promise<PestRecord> {
    const id = input.id || crypto.randomUUID();
    const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();

    return this.repository.create({
      id,
      pestName: input.pestName,
      quantity: input.quantity,
      crop: input.crop || '',
      plot: input.plot || '',
      growthStage: input.growthStage || '',
      notes: input.notes || '',
      latitude: input.latitude,
      longitude: input.longitude,
      altitude: input.altitude ?? null,
      accuracy: input.accuracy ?? null,
      imagePath: input.imagePath ?? null,
      createdAt,
      ...(userId ? { user: { connect: { id: userId } } } : {}),
    });
  }

  async findById(id: string): Promise<PestRecord> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundError(`Registro de praga com ID ${id} não encontrado`);
    }
    return record;
  }

  async findMany(query: PestRecordQuery, userId?: string, role?: Role) {
    // Administradores e Agrônomos podem visualizar todos os registros.
    // Operadores podem filtrar pelos seus próprios registros caso queiram.
    const filterUserId = role === Role.OPERATOR ? userId : undefined;
    return this.repository.findMany(query, filterUserId);
  }

  async update(id: string, input: UpdatePestRecordInput, userId?: string, role?: Role): Promise<PestRecord> {
    const existing = await this.findById(id);

    // Regra de segurança: operadores só podem editar registros criados por eles mesmos
    if (role === Role.OPERATOR && existing.userId && existing.userId !== userId) {
      throw new ForbiddenError('Você só pode editar registros criados por você');
    }

    return this.repository.update(id, {
      ...input,
      updatedAt: new Date(),
    });
  }

  async delete(id: string, userId?: string, role?: Role): Promise<PestRecord> {
    const existing = await this.findById(id);

    if (role === Role.OPERATOR && existing.userId && existing.userId !== userId) {
      throw new ForbiddenError('Você só pode excluir registros criados por você');
    }

    return this.repository.delete(id);
  }

  async findNearby(query: NearbyQuery, userId?: string, role?: Role): Promise<NearbyPestRecord[]> {
    const filterUserId = role === Role.OPERATOR ? userId : undefined;
    return this.repository.findNearby(query, filterUserId);
  }

  /**
   * Sincronização em lote para o modo Offline-First do app mobile.
   * Recebe um lote de registros coletados em campo e persiste todos atomicamente.
   */
  async sync(input: SyncPestRecordsInput, userId?: string): Promise<{ syncedCount: number; message: string }> {
    const formattedRecords = input.records.map((rec) => ({
      id: rec.id || crypto.randomUUID(),
      pestName: rec.pestName,
      quantity: rec.quantity,
      crop: rec.crop || '',
      plot: rec.plot || '',
      growthStage: rec.growthStage || '',
      notes: rec.notes || '',
      latitude: rec.latitude,
      longitude: rec.longitude,
      altitude: rec.altitude ?? null,
      accuracy: rec.accuracy ?? null,
      imagePath: rec.imagePath ?? null,
      userId: userId ?? null,
      createdAt: rec.createdAt ? new Date(rec.createdAt) : new Date(),
      updatedAt: new Date(),
    }));

    const result = await this.repository.upsertMany(formattedRecords);

    return {
      syncedCount: result.count,
      message: `${result.count} registro(s) sincronizado(s) com sucesso com o servidor central`,
    };
  }

  async exportGeoJson(query: PestRecordQuery, userId?: string, role?: Role): Promise<GeoJsonFeatureCollection> {
    const filterUserId = role === Role.OPERATOR ? userId : undefined;
    const records = await this.repository.findAllForExport(query, filterUserId);
    return formatRecordsToFeatureCollection(records);
  }

  async exportCsv(query: PestRecordQuery, userId?: string, role?: Role): Promise<string> {
    const filterUserId = role === Role.OPERATOR ? userId : undefined;
    const records = await this.repository.findAllForExport(query, filterUserId);
    return formatRecordsToCsv(records);
  }
}
