import express from 'express';
import { apiLimiter } from '../middlewares/rateLimiter';
import { userRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { projectRoutes } from '../modules/project/project.routes';
import { taskRoutes } from '../modules/task/task.routes';

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
