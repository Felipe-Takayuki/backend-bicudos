import { prisma } from '../../../config/prisma';
import { PestRecord, Prisma } from '@prisma/client';
import { PestRecordQuery, NearbyQuery } from '../schemas/pest-record.schema';

export interface NearbyPestRecord extends PestRecord {
  distance_meters: number;
}

export class PestRecordRepository {
  async create(data: Prisma.PestRecordCreateInput): Promise<PestRecord> {
    return prisma.pestRecord.create({
      data,
    });
  }

  async findById(id: string): Promise<PestRecord | null> {
    return prisma.pestRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  private buildWhereClause(query: PestRecordQuery, userId?: string): Prisma.PestRecordWhereInput {
    const where: Prisma.PestRecordWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (query.pestName) {
      where.pestName = {
        contains: query.pestName,
        mode: 'insensitive',
      };
    }

    if (query.crop) {
      where.crop = {
        contains: query.crop,
        mode: 'insensitive',
      };
    }

    if (query.plot) {
      where.plot = {
        contains: query.plot,
        mode: 'insensitive',
      };
    }

    if (query.minQuantity !== undefined) {
      where.quantity = {
        gte: query.minQuantity,
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        // Até o final do dia
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return where;
  }

  async findMany(
    query: PestRecordQuery,
    userId?: string
  ): Promise<{ records: PestRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(query, userId);

    const [records, total] = await Promise.all([
      prisma.pestRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.pestRecord.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllForExport(query: PestRecordQuery, userId?: string): Promise<PestRecord[]> {
    const where = this.buildWhereClause(query, userId);
    return prisma.pestRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.PestRecordUpdateInput): Promise<PestRecord> {
    return prisma.pestRecord.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<PestRecord> {
    return prisma.pestRecord.delete({
      where: { id },
    });
  }

  async upsertMany(records: Prisma.PestRecordCreateManyInput[]): Promise<{ count: number }> {
    // Para SQLite ou PostgreSQL, processa registros em transação com upsert
    let processed = 0;

    await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        await tx.pestRecord.upsert({
          where: { id: rec.id! },
          update: {
            pestName: rec.pestName,
            quantity: rec.quantity,
            crop: rec.crop,
            plot: rec.plot,
            growthStage: rec.growthStage,
            notes: rec.notes,
            latitude: rec.latitude,
            longitude: rec.longitude,
            altitude: rec.altitude,
            accuracy: rec.accuracy,
            imagePath: rec.imagePath,
            updatedAt: new Date(),
          },
          create: rec,
        });
        processed++;
      }
    });

    return { count: processed };
  }

  /**
   * Busca registros próximos utilizando a fórmula de Haversine diretamente em SQL,
   * compatível tanto com PostgreSQL quanto com SQLite.
   */
  async findNearby(query: NearbyQuery, userId?: string): Promise<NearbyPestRecord[]> {
    const { latitude, longitude, radius, pestName } = query;
    const earthRadiusMeters = 6371000;

    // Converte parâmetros para radianos e calcula a distância
    // Haversine: 2 * R * asin(sqrt(sin^2(dlat/2) + cos(lat1)*cos(lat2)*sin^2(dlon/2)))
    const records = await prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        pest_name AS "pestName", 
        quantity, 
        crop, 
        plot, 
        growth_stage AS "growthStage", 
        notes, 
        latitude, 
        longitude, 
        altitude, 
        accuracy, 
        image_path AS "imagePath", 
        user_id AS "userId", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt",
        (
          ${earthRadiusMeters} * 2 * ASIN(
            SQRT(
              POWER(SIN(RADIANS(latitude - ${latitude}) / 2), 2) +
              COS(RADIANS(${latitude})) * COS(RADIANS(latitude)) *
              POWER(SIN(RADIANS(longitude - ${longitude}) / 2), 2)
            )
          )
        ) AS distance_meters
      FROM pest_records
      WHERE (
        ${earthRadiusMeters} * 2 * ASIN(
          SQRT(
            POWER(SIN(RADIANS(latitude - ${latitude}) / 2), 2) +
            COS(RADIANS(${latitude})) * COS(RADIANS(latitude)) *
            POWER(SIN(RADIANS(longitude - ${longitude}) / 2), 2)
          )
        )
      ) <= ${radius}
      ${pestName ? Prisma.sql`AND pest_name ILIKE ${`%${pestName}%`}` : Prisma.empty}
      ${userId ? Prisma.sql`AND user_id = ${userId}` : Prisma.empty}
      ORDER BY distance_meters ASC
      LIMIT 100;
    `;

    return records.map((r) => ({
      ...r,
      distance_meters: Math.round(Number(r.distance_meters)),
    }));
  }
}
