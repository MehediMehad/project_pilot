import express from 'express';
import { apiLimiter } from '../middlewares/rateLimiter';
import { userRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { projectRoutes } from '../modules/project/project.routes';
import { taskRoutes } from '../modules/task/task.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { activityRoutes } from '../modules/activity/activity.routes';

const router = express.Router();

router.use(apiLimiter); // Apply to all routes

const moduleRoutes = [
  {
    path: '/user',
    route: userRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/project',
    route: projectRoutes,
  },
  {
    path: '/task',
    route: taskRoutes,
  },
  {
    path: '/notification',
    route: notificationRoutes,
  },
  {
    path: '/dashboard',
    route: dashboardRoutes,
  },
  {
    path: '/activity',
    route: activityRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
