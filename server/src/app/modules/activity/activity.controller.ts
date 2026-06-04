import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IAuthUser } from '../../interfaces/common';
import { activityService } from './activity.service';

const getAllActivities = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const query = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };

    const result = await activityService.getAllActivities(
      req.user as IAuthUser,
      query
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Activities fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  }
);

export const activityController = {
  getAllActivities,
};
