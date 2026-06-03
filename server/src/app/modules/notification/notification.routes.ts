import { UserRole } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import { notificationController } from './notification.controller';

const router = express.Router();

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  notificationController.getUserNotifications,
);

router.patch(
  '/read-all',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  notificationController.markAllNotificationsAsRead,
);

router.patch(
  '/:id/read',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  notificationController.markNotificationAsRead,
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  notificationController.deleteNotification,
);

export const notificationRoutes = router;
