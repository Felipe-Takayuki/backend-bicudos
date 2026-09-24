import { Request, Response, NextFunction } from 'express';
import { PestRecordService } from '../services/pest-record.service';

export class PestRecordController {
  constructor(private readonly service: PestRecordService = new PestRecordService()) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const record = await this.service.create(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Registro de praga criado com sucesso',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const record = await this.service.findById(id);
      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  findMany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.findMany(req.query as any, req.user?.id, req.user?.role);
      res.status(200).json({
        success: true,
        data: result.records,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const updated = await this.service.update(id, req.body, req.user?.id, req.user?.role);
      res.status(200).json({
        success: true,
        message: 'Registro de praga atualizado com sucesso',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      await this.service.delete(id, req.user?.id, req.user?.role);
      res.status(200).json({
        success: true,
        message: 'Registro de praga excluído com sucesso',
      });
    } catch (error) {
      next(error);
    }
  };

  findNearby = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const records = await this.service.findNearby(req.query as any, req.user?.id, req.user?.role);
      res.status(200).json({
        success: true,
        data: records,
        count: records.length,
      });
    } catch (error) {
      next(error);
    }
  };

  sync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.sync(req.body, req.user?.id);
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          syncedCount: result.syncedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  exportGeoJson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const geoJson = await this.service.exportGeoJson(req.query as any, req.user?.id, req.user?.role);
      res.setHeader('Content-Type', 'application/geo+json');
      res.setHeader('Content-Disposition', 'attachment; filename="pragas.geojson"');
      res.status(200).json(geoJson);
    } catch (error) {
      next(error);
    }
  };

  exportCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const csv = await this.service.exportCsv(req.query as any, req.user?.id, req.user?.role);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="pragas.csv"');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  };
}
