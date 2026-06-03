import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { IAuthUser } from '../../interfaces/common';
import ApiError from '../../errors/ApiError';

const getUserNotifications = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const result = await notificationService.getUserNotifications(user.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications fetched successfully',
    data: result,
  });
});

const markAllNotificationsAsRead = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const result = await notificationService.markAllNotificationsAsRead(user.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All notifications marked as read',
    data: result,
  });
});

const markNotificationAsRead = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }
  const { id } = req.params;
  const result = await notificationService.markNotificationAsRead(user.email, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification marked as read',
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }
  const { id } = req.params;
  await notificationService.deleteNotification(user.email, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification deleted successfully',
    data: null,
  });
});

export const notificationController = {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
};
