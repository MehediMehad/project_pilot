import { UserRole } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import { activityController } from './activity.controller';

const router = express.Router();

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  activityController.getAllActivities
);

export const activityRoutes = router;
