import { UserRole } from '@prisma/client';
import express, { NextFunction, Request, Response } from 'express';
import { fileUploader } from '../../../helpers/fileUploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { userController } from './user.controller';
import { userValidation } from './user.validation';

const router = express.Router();

router.get('/', auth(UserRole.ADMIN), userController.getAllFromDB);

router.get('/me', auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER), userController.getMyProfile);

router.post(
  '/register',
  fileUploader.upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.registerUser.parse(JSON.parse(req.body.data));
    return userController.registerUser(req, res, next);
  },
);

router.patch(
  '/:id/status',
  auth(UserRole.ADMIN),
  validateRequest(userValidation.updateStatus),
  userController.changeProfileStatus,
);

router.patch(
  '/update-my-profile',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  fileUploader.upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);
    return userController.updateMyProfile(req, res, next);
  },
);

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER),
  userController.getSingleUser,
);

router.patch(
  '/:id/role',
  auth(UserRole.ADMIN),
  validateRequest(userValidation.updateRole),
  userController.updateUserRole,
);

export const userRoutes = router;
