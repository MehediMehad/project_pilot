import { UserRole } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { projectController } from './project.controller';
import { projectValidation } from './project.validation';

const router = express.Router();

// CRUD
router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validateRequest(projectValidation.createProject),
  projectController.createProject,
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  projectController.getAllProjects,
);

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  projectController.getSingleProject,
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validateRequest(projectValidation.updateProject),
  projectController.updateProject,
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  projectController.deleteProject,
);

// Members
router.post(
  '/:id/members',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validateRequest(projectValidation.addMember),
  projectController.addProjectMember,
);

router.delete(
  '/:id/members/:userId',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  projectController.removeProjectMember,
);

router.get(
  '/:id/members',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  projectController.getProjectMembers,
);

// Summary
router.get(
  '/:id/summary',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  projectController.getProjectSummary,
);

export const projectRoutes = router;
