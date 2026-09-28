import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { SignupDto, LoginDto, RefreshTokenDto } from './auth.dto.js';

const router = Router();

router.post('/signup', validateRequest({ body: SignupDto }), (req, res, next) =>
  authController.signup(req, res, next)
);

router.post('/login', validateRequest({ body: LoginDto }), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/refresh', validateRequest({ body: RefreshTokenDto }), (req, res, next) =>
  authController.refresh(req, res, next)
);

router.post('/logout', (req, res, next) => authController.logout(req, res, next));

export const authRoutes = router;
