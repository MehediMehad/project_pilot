import { UserRole } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { taskController } from './task.controller';
import { taskValidation } from './task.validation';
import { fileUploader } from '../../../helpers/fileUploader';

const router = express.Router();

// Special task filters (placed above /:id route so they are not caught as parameter id)
router.get(
  '/my-tasks',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.getMyTasks,
);

router.get(
  '/overdue',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.getOverdueTasks,
);

router.get(
  '/upcoming',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.getUpcomingTasks,
);

// Standard CRUD
router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validateRequest(taskValidation.createTask),
  taskController.createTask,
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.getAllTasks,
);

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.getSingleTask,
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  validateRequest(taskValidation.updateTask),
  taskController.updateTask,
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  taskController.deleteTask,
);

// Comment Routes
router.post(
  '/:taskId/comments',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  validateRequest(taskValidation.createComment),
  taskController.createComment,
);

router.get(
  '/:taskId/comments',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.getTaskComments,
);

router.patch(
  '/comments/:commentId',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  validateRequest(taskValidation.updateComment),
  taskController.updateComment,
);

router.delete(
  '/comments/:commentId',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.deleteComment,
);

// Attachment Routes
router.post(
  '/:taskId/attachments',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  fileUploader.upload.single('file'),
  taskController.createAttachment,
);

router.get(
  '/:taskId/attachments',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.getTaskAttachments,
);

router.delete(
  '/attachments/:attachmentId',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.deleteAttachment,
);

router.get(
  '/:id/activity',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  taskController.getTaskActivityLogs,
);

export const taskRoutes = router;
