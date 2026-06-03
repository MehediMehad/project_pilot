import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { dashboardService } from './dashboard.service';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const result = await dashboardService.getDashboardStats(dbUser.id, dbUser.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: result,
  });
});

export const dashboardController = {
  getDashboardStats,
};
