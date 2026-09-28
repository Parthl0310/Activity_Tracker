import { Router } from 'express';
import { profileController } from './profile.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { SetupProfileDto, UpdateProfileDto } from './profile.dto.js';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

router.get('/', (req, res, next) => profileController.getProfile(req, res, next));

router.post('/setup', validateRequest({ body: SetupProfileDto }), (req, res, next) =>
  profileController.setupProfile(req, res, next)
);

router.patch('/', validateRequest({ body: UpdateProfileDto }), (req, res, next) =>
  profileController.updateProfile(req, res, next)
);

export const profileRoutes = router;
