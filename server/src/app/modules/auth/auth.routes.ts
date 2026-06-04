import { UserRole } from '@prisma/client';
import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rateLimiter';
import { AuthController } from './auth.controller';

const router = express.Router();

router.post('/login', authLimiter, AuthController.loginUser);

router.post('/refresh-token', AuthController.refreshToken);

router.post(
  '/change-password',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  AuthController.changePassword,
);

router.post('/forgot-password', AuthController.forgotPassword);

router.post(
  '/reset-password',
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization && req.cookies.accessToken) {
      auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER)(req, res, next);
    } else {
      next();
    }
  },
  AuthController.resetPassword,
);

router.get('/me', auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER), AuthController.getMe);
router.post('/logout', AuthController.logoutUser);

export const AuthRoutes = router;
