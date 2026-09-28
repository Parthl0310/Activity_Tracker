import { Router } from 'express';
import { yearlyReportController } from './yearlyReport.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  YearParamDto,
  EditSectionParamsDto,
  EditSectionBodyDto,
} from './yearlyReport.dto.js';

const router = Router();

// All report routes require authentication
router.use(authenticate);

router.get(
  '/yearly/:year/availability',
  validateRequest({ params: YearParamDto }),
  (req, res, next) => yearlyReportController.checkAvailability(req, res, next)
);

router.post(
  '/yearly/:year/generate',
  validateRequest({ params: YearParamDto }),
  (req, res, next) => yearlyReportController.generateReport(req, res, next)
);

router.get(
  '/yearly/:year',
  validateRequest({ params: YearParamDto }),
  (req, res, next) => yearlyReportController.getReport(req, res, next)
);

router.patch(
  ['/yearly/:year/section/:name', '/yearly/:year/sections/:name'],
  validateRequest({ params: EditSectionParamsDto, body: EditSectionBodyDto }),
  (req, res, next) => yearlyReportController.editSection(req, res, next)
);

router.put(
  ['/yearly/:year/section/:name', '/yearly/:year/sections/:name'],
  validateRequest({ params: EditSectionParamsDto, body: EditSectionBodyDto }),
  (req, res, next) => yearlyReportController.editSection(req, res, next)
);

router.post(
  ['/yearly/:year/section/:name/regenerate', '/yearly/:year/sections/:name/regenerate'],
  validateRequest({ params: EditSectionParamsDto }),
  (req, res, next) => yearlyReportController.regenerateSection(req, res, next)
);

router.post(
  '/yearly/:year/finalize',
  validateRequest({ params: YearParamDto }),
  (req, res, next) => yearlyReportController.finalizeReport(req, res, next)
);

router.post(
  '/yearly/:year/unlock',
  validateRequest({ params: YearParamDto }),
  (req, res, next) => yearlyReportController.unlockReport(req, res, next)
);

router.post(
  '/yearly/:year/merge',
  validateRequest({ params: YearParamDto }),
  (req, res, next) => yearlyReportController.mergeReports(req, res, next)
);

router.get(
  '/yearly/:year/versions',
  validateRequest({ params: YearParamDto }),
  (req, res, next) => yearlyReportController.listReportVersions(req, res, next)
);

router.delete(
  ['/yearly/:year', '/yearly/:year/version/:version'],
  validateRequest({ params: YearParamDto }),
  (req, res, next) => yearlyReportController.deleteReportVersion(req, res, next)
);

export const reportsRoutes = router;
