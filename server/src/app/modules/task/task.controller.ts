import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import prisma from '../../../shared/prisma';
import { IAuthUser } from '../../interfaces/common';
import { taskFilterableFields } from './task.constant';
import { taskService } from './task.service';

import ApiError from '../../errors/ApiError';

const createTask = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await taskService.createTask(
      req.user as IAuthUser,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Task created successfully!',
      data: result,
    });
  },
);

const getAllTasks = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const filters = pick(req.query, taskFilterableFields);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await taskService.getAllTasks(
      filters,
      options,
      req.user as IAuthUser,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Tasks fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  },
);

const getMyTasks = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    const userData = await prisma.user.findUniqueOrThrow({
      where: { email: user.email },
    });

    const filters = pick(req.query, taskFilterableFields);
    filters.assignedToId = userData.id; // Override to target current user

    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await taskService.getAllTasks(
      filters,
      options,
      req.user as IAuthUser,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'My tasks fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  },
);

const getOverdueTasks = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const filters = pick(req.query, taskFilterableFields);
    filters.overdue = 'true';

    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await taskService.getAllTasks(
      filters,
      options,
      req.user as IAuthUser,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Overdue tasks fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  },
);

const getUpcomingTasks = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const filters = pick(req.query, taskFilterableFields);
    filters.upcoming = 'true';

    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await taskService.getAllTasks(
      filters,
      options,
      req.user as IAuthUser,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Upcoming tasks fetched successfully!',
      meta: result.meta,
      data: result.data,
    });
  },
);

const getSingleTask = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const result = await taskService.getSingleTask(id, req.user as IAuthUser);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Task fetched successfully!',
      data: result,
    });
  },
);

const updateTask = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const result = await taskService.updateTask(
      id,
      req.body,
      req.user as IAuthUser,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Task updated successfully!',
      data: result,
    });
  },
);

const deleteTask = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const { id } = req.params;
    const result = await taskService.deleteTask(id, req.user as IAuthUser);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Task deleted successfully!',
      data: result,
    });
  },
);

export const taskController = {
  createTask,
  getAllTasks,
  getMyTasks,
  getOverdueTasks,
  getUpcomingTasks,
  getSingleTask,
  updateTask,
  deleteTask,
};
