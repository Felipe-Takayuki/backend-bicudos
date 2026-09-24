import { Request, Response, NextFunction } from 'express';
import { StatisticsService } from '../services/statistics.service';

export class StatisticsController {
  constructor(private readonly service: StatisticsService = new StatisticsService()) {}

  getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getOverview(req.user?.id);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
