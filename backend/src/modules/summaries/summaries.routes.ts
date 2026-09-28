import { Router } from 'express';
import { summariesController } from './summaries.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  validateRequest,
  validateObjectId,
} from '../../middleware/validate.middleware.js';
import {
  WeeklyQueryDto,
  GenerateWeeklySummaryDto,
  EditWeeklySummaryDto,
  MonthlyQueryDto,
  GenerateMonthlySummaryDto,
  EditMonthlySummaryDto,
  ListSummariesQueryDto,
} from './summaries.dto.js';

const router = Router();

// All summary routes require authentication
router.use(authenticate);

// Weekly Routes
router.get(
  '/weekly',
  validateRequest({ query: WeeklyQueryDto }),
  (req, res, next) => summariesController.getWeeklySummary(req, res, next)
);

router.post(
  '/weekly/generate',
  validateRequest({ body: GenerateWeeklySummaryDto }),
  (req, res, next) => summariesController.generateWeeklySummary(req, res, next)
);

router.post(
  '/weekly/:id/regenerate',
  validateObjectId('id'),
  (req, res, next) => summariesController.regenerateWeeklySummary(req, res, next)
);

router.patch(
  '/weekly/:id',
  validateObjectId('id'),
  validateRequest({ body: EditWeeklySummaryDto }),
  (req, res, next) => summariesController.editWeeklySummary(req, res, next)
);

router.get(
  '/weekly/list',
  validateRequest({ query: ListSummariesQueryDto }),
  (req, res, next) => summariesController.listWeeklySummaries(req, res, next)
);

// Monthly Routes
router.get(
  '/monthly',
  validateRequest({ query: MonthlyQueryDto }),
  (req, res, next) => summariesController.getMonthlySummary(req, res, next)
);

router.post(
  '/monthly/generate',
  validateRequest({ body: GenerateMonthlySummaryDto }),
  (req, res, next) => summariesController.generateMonthlySummary(req, res, next)
);

router.post(
  '/monthly/:id/regenerate',
  validateObjectId('id'),
  (req, res, next) => summariesController.regenerateMonthlySummary(req, res, next)
);

router.patch(
  '/monthly/:id',
  validateObjectId('id'),
  validateRequest({ body: EditMonthlySummaryDto }),
  (req, res, next) => summariesController.editMonthlySummary(req, res, next)
);

router.get(
  '/monthly/list',
  validateRequest({ query: ListSummariesQueryDto }),
  (req, res, next) => summariesController.listMonthlySummaries(req, res, next)
);

router.delete(
  '/monthly',
  validateRequest({ query: MonthlyQueryDto }),
  (req, res, next) => summariesController.deleteMonthlySummary(req, res, next)
);

export const summariesRoutes = router;
