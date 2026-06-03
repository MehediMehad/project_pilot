import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { IAuthUser } from '../../interfaces/common';
import { projectFilterableFields } from './project.constant';
import { projectService } from './project.service';

const createProject = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const result = await projectService.createProject(req.user as IAuthUser, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Project created successfully!',
    data: result,
  });
});

const getAllProjects = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const filters = pick(req.query, projectFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  const result = await projectService.getAllProjects(filters, options, req.user as IAuthUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Projects fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleProject = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { id } = req.params;
  const result = await projectService.getSingleProject(id, req.user as IAuthUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project fetched successfully!',
    data: result,
  });
});

const updateProject = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { id } = req.params;
  const result = await projectService.updateProject(id, req.body, req.user as IAuthUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project updated successfully!',
    data: result,
  });
});

const deleteProject = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { id } = req.params;
  const result = await projectService.deleteProject(id, req.user as IAuthUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project deleted successfully!',
    data: result,
  });
});

const addProjectMember = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  const result = await projectService.addProjectMember(id, userId, req.user as IAuthUser);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Member added to project successfully!',
    data: result,
  });
});

const removeProjectMember = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
  const { id, userId } = req.params;
  const result = await projectService.removeProjectMember(id, userId, req.user as IAuthUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Member removed from project successfully!',
    data: result,
  });
});

const getProjectMembers = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await projectService.getProjectMembers(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project members fetched successfully!',
    data: result,
  });
});

const getProjectSummary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await projectService.getProjectSummary(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project summary fetched successfully!',
    data: result,
  });
});

export const projectController = {
  createProject,
  getAllProjects,
  getSingleProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  getProjectSummary,
};
