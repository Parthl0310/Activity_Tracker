import { Router } from 'express';
import { insightsController } from './insights.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { YearQueryDto } from './insights.dto.js';

const router = Router();

// All insights routes require authentication
router.use(authenticate);

router.get(
  '/overview',
  validateRequest({ query: YearQueryDto }),
  (req, res, next) => insightsController.getYearlyOverview(req, res, next)
);

router.get('/ai', validateRequest({ query: YearQueryDto }), (req, res, next) =>
  insightsController.getAIInsights(req, res, next)
);

export const insightsRoutes = router;
