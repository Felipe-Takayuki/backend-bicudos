import { prisma } from '../../../config/prisma';

export interface PestOverviewStatistics {
  totalRecords: number;
  totalPests: number;
  averagePerPoint: number;
  maxInfestation: {
    id: string;
    pestName: string;
    quantity: number;
    plot: string;
    crop: string;
    latitude: number;
    longitude: number;
    createdAt: Date;
  } | null;
  predominantPest: {
    pestName: string;
    totalCount: number;
    recordsCount: number;
  } | null;
  pestsDistribution: {
    pestName: string;
    totalQuantity: number;
    pointsCount: number;
    percentage: number;
  }[];
}

export class StatisticsService {
  async getOverview(userId?: string): Promise<PestOverviewStatistics> {
    const where = userId ? { userId } : {};

    const [totalRecords, aggregations, maxInfestationRecord, pestGroups] = await Promise.all([
      prisma.pestRecord.count({ where }),
      prisma.pestRecord.aggregate({
        where,
        _sum: {
          quantity: true,
        },
        _avg: {
          quantity: true,
        },
      }),
      prisma.pestRecord.findFirst({
        where,
        orderBy: { quantity: 'desc' },
      }),
      prisma.pestRecord.groupBy({
        by: ['pestName'],
        where,
        _sum: {
          quantity: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
      }),
    ]);

    const totalPests = aggregations._sum.quantity || 0;
    const averagePerPoint = totalRecords > 0 ? Number((totalPests / totalRecords).toFixed(1)) : 0;

    let predominantPest = null;
    if (pestGroups.length > 0) {
      predominantPest = {
        pestName: pestGroups[0].pestName,
        totalCount: pestGroups[0]._sum.quantity || 0,
        recordsCount: pestGroups[0]._count.id || 0,
      };
    }

    const pestsDistribution = pestGroups.map((g) => {
      const qty = g._sum.quantity || 0;
      return {
        pestName: g.pestName,
        totalQuantity: qty,
        pointsCount: g._count.id || 0,
        percentage: totalPests > 0 ? Number(((qty / totalPests) * 100).toFixed(1)) : 0,
      };
    });

    const maxInfestation = maxInfestationRecord
      ? {
          id: maxInfestationRecord.id,
          pestName: maxInfestationRecord.pestName,
          quantity: maxInfestationRecord.quantity,
          plot: maxInfestationRecord.plot ?? '',
          crop: maxInfestationRecord.crop ?? '',
          latitude: maxInfestationRecord.latitude,
          longitude: maxInfestationRecord.longitude,
          createdAt: maxInfestationRecord.createdAt,
        }
      : null;

    return {
      totalRecords,
      totalPests,
      averagePerPoint,
      maxInfestation,
      predominantPest,
      pestsDistribution,
    };
  }
}
