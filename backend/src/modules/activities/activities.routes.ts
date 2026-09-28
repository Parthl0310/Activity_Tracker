import { Router } from 'express';
import { activitiesController } from './activities.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  validateRequest,
  validateObjectId,
} from '../../middleware/validate.middleware.js';
import {
  CreateActivityDto,
  UpdateActivityDto,
  ListActivitiesQueryDto,
  EnrichPreviewDto,
} from './activities.dto.js';

const router = Router();

// All activity routes require authentication
router.use(authenticate);

router.post(
  '/enrich-preview',
  validateRequest({ body: EnrichPreviewDto }),
  (req, res, next) => activitiesController.enrichPreview(req, res, next)
);

router.post(
  '/',
  validateRequest({ body: CreateActivityDto }),
  (req, res, next) => activitiesController.createActivity(req, res, next)
);

router.get(
  '/',
  validateRequest({ query: ListActivitiesQueryDto }),
  (req, res, next) => activitiesController.listActivities(req, res, next)
);

router.get('/:id', validateObjectId('id'), (req, res, next) =>
  activitiesController.getActivity(req, res, next)
);

router.patch(
  '/:id',
  validateObjectId('id'),
  validateRequest({ body: UpdateActivityDto }),
  (req, res, next) => activitiesController.updateActivity(req, res, next)
);

router.delete('/:id', validateObjectId('id'), (req, res, next) =>
  activitiesController.deleteActivity(req, res, next)
);

router.post('/:id/improve', validateObjectId('id'), (req, res, next) =>
  activitiesController.improveEntry(req, res, next)
);

export const activitiesRoutes = router;
