import { Router } from 'express';
import { StatisticsController } from './controllers/statistics.controller';
import { optionalAuth } from '../../core/middlewares/auth.middleware';

const statisticsRouter = Router();
const controller = new StatisticsController();

statisticsRouter.get('/overview', optionalAuth, controller.getOverview);

export { statisticsRouter };
