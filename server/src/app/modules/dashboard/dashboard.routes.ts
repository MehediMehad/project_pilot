import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { dashboardController } from './dashboard.controller';

const router = express.Router();

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  dashboardController.getDashboardStats,
);

export const dashboardRoutes = router;
