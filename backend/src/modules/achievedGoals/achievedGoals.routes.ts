import { Router } from 'express';
import { achievedGoalsController } from './achievedGoals.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  validateRequest,
  validateObjectId,
} from '../../middleware/validate.middleware.js';
import {
  CreateAchievedGoalDto,
  UpdateAchievedGoalDto,
  LinkActivitiesDto,
  ListAchievedGoalsQueryDto,
} from './achievedGoals.dto.js';

const router = Router();

// All achieved goal routes require authentication
router.use(authenticate);

router.post(
  '/',
  validateRequest({ body: CreateAchievedGoalDto }),
  (req, res, next) => achievedGoalsController.createGoal(req, res, next)
);

router.get(
  '/',
  validateRequest({ query: ListAchievedGoalsQueryDto }),
  (req, res, next) => achievedGoalsController.listGoals(req, res, next)
);

router.get('/:id', validateObjectId('id'), (req, res, next) =>
  achievedGoalsController.getGoal(req, res, next)
);

router.patch(
  '/:id',
  validateObjectId('id'),
  validateRequest({ body: UpdateAchievedGoalDto }),
  (req, res, next) => achievedGoalsController.updateGoal(req, res, next)
);

router.delete('/:id', validateObjectId('id'), (req, res, next) =>
  achievedGoalsController.deleteGoal(req, res, next)
);

router.post(
  '/:id/link-activities',
  validateObjectId('id'),
  validateRequest({ body: LinkActivitiesDto }),
  (req, res, next) => achievedGoalsController.linkActivities(req, res, next)
);

export const achievedGoalsRoutes = router;
