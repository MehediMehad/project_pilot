import { Prisma, Task, UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import { paginationHelper } from '../../../helpers/paginationHelper';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import { IAuthUser } from '../../interfaces/common';
import { IPaginationOptions } from '../../interfaces/pagination';
import { taskSearchAbleFields } from './task.constant';

const createTask = async (user: IAuthUser, payload: any): Promise<Task> => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });

  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  // Auth: Admin can do anything; PM must be a member of the project
  if (userData.role !== UserRole.ADMIN) {
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: payload.projectId,
          userId: userData.id,
        },
      },
    });

    if (!isMember) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not a member of this project',
      );
    }
  }

  // If assignee is provided, check if they are a member of the project
  if (payload.assignedToId) {
    const isAssigneeMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: payload.projectId,
          userId: payload.assignedToId,
        },
      },
    });

    if (!isAssigneeMember) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Assignee must be a member of the project',
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: payload.title,
        description: payload.description,
        dueDate: new Date(payload.dueDate),
        priority: payload.priority || 'MEDIUM',
        status: payload.status || 'TODO',
        projectId: payload.projectId,
        assignedToId: payload.assignedToId || null,
      },
    });

    // Log Activity
    await tx.activityLog.create({
      data: {
        message: `Task "${task.title}" was created`,
        type: 'TASK_CREATED',
        userId: userData.id,
        projectId: task.projectId,
        taskId: task.id,
      },
    });

    return task;
  });

  return result;
};

const getAllTasks = async (
  params: any,
  options: IPaginationOptions,
  user: IAuthUser,
) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, overdue, upcoming, ...filterData } = params;

  const andConditions: Prisma.TaskWhereInput[] = [];

  // Search
  if (searchTerm) {
    andConditions.push({
      OR: taskSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  // Filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // Overdue / Upcoming
  const now = new Date();
  if (overdue === 'true') {
    andConditions.push({
      dueDate: {
        lt: now,
      },
      status: {
        not: 'COMPLETED',
      },
    });
  } else if (upcoming === 'true') {
    andConditions.push({
      dueDate: {
        gt: now,
      },
      status: {
        not: 'COMPLETED',
      },
    });
  }

  // Role-based visibility:
  // If user is not ADMIN, only show tasks of projects they are members of
  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  if (userData.role !== UserRole.ADMIN) {
    andConditions.push({
      project: {
        members: {
          some: {
            userId: userData.id,
          },
        },
      },
    });
  }

  const whereConditions: Prisma.TaskWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Sort logic
  const orderBy: Prisma.TaskOrderByWithRelationInput =
    upcoming === 'true'
      ? { dueDate: 'asc' }
      : options.sortBy && options.sortOrder
      ? { [options.sortBy]: options.sortOrder }
      : { createdAt: 'desc' };

  const result = await prisma.task.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy,
    include: {
      project: {
        select: { id: true, name: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
    },
  });

  const total = await prisma.task.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getSingleTask = async (id: string, user: IAuthUser): Promise<Task> => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const task = await prisma.task.findUniqueOrThrow({
    where: { id },
    include: {
      project: {
        select: { id: true, name: true, createdById: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
    },
  });

  // Verify membership if not Admin
  if (userData.role !== UserRole.ADMIN) {
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: userData.id,
        },
      },
    });

    if (!isMember) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not authorized to view this task',
      );
    }
  }

  return task;
};

const updateTask = async (
  id: string,
  payload: any,
  user: IAuthUser,
): Promise<Task> => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const task = await prisma.task.findUniqueOrThrow({
    where: { id },
  });

  // Verify membership if not Admin
  if (userData.role !== UserRole.ADMIN) {
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: userData.id,
        },
      },
    });

    if (!isMember) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not authorized to update tasks in this project',
      );
    }
  }

  // If assignedToId is being updated, verify they are project member
  if (payload.assignedToId) {
    const isAssigneeMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: payload.assignedToId,
        },
      },
    });

    if (!isAssigneeMember) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Assignee must be a member of the project',
      );
    }
  }

  const updateData: any = {};
  if (payload.title) updateData.title = payload.title;
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.dueDate) updateData.dueDate = new Date(payload.dueDate);
  if (payload.priority) updateData.priority = payload.priority;
  if (payload.status) updateData.status = payload.status;
  if (payload.assignedToId !== undefined)
    updateData.assignedToId = payload.assignedToId;

  const result = await prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({
      where: { id },
      data: updateData,
    });

    // Check specific activity log additions
    if (
      payload.assignedToId !== undefined &&
      payload.assignedToId !== task.assignedToId
    ) {
      let assigneeName = 'Unassigned';
      if (payload.assignedToId) {
        const assignedUser = await tx.user.findUnique({
          where: { id: payload.assignedToId },
          select: { name: true },
        });
        assigneeName = assignedUser?.name || 'User';
      }

      await tx.activityLog.create({
        data: {
          message: `Task "${updatedTask.title}" was assigned to ${assigneeName}`,
          type: 'TASK_ASSIGNED',
          userId: userData.id,
          projectId: updatedTask.projectId,
          taskId: updatedTask.id,
        },
      });
    }

    if (payload.status && payload.status !== task.status) {
      if (payload.status === 'COMPLETED') {
        await tx.activityLog.create({
          data: {
            message: `Task "${updatedTask.title}" was completed`,
            type: 'TASK_COMPLETED',
            userId: userData.id,
            projectId: updatedTask.projectId,
            taskId: updatedTask.id,
          },
        });
      } else {
        await tx.activityLog.create({
          data: {
            message: `Task "${updatedTask.title}" status updated to ${payload.status}`,
            type: 'TASK_UPDATED',
            userId: userData.id,
            projectId: updatedTask.projectId,
            taskId: updatedTask.id,
          },
        });
      }
    } else if (
      !payload.status &&
      (payload.assignedToId === undefined ||
        payload.assignedToId === task.assignedToId)
    ) {
      // General task details update
      await tx.activityLog.create({
        data: {
          message: `Task "${updatedTask.title}" was updated`,
          type: 'TASK_UPDATED',
          userId: userData.id,
          projectId: updatedTask.projectId,
          taskId: updatedTask.id,
        },
      });
    }

    return updatedTask;
  });

  return result;
};

const deleteTask = async (id: string, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const task = await prisma.task.findUniqueOrThrow({
    where: { id },
  });

  // Authorization: Only Admin or PM member of the project can delete
  if (userData.role !== UserRole.ADMIN) {
    if (userData.role !== UserRole.PROJECT_MANAGER) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Only project managers or admins can delete tasks',
      );
    }

    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: userData.id,
        },
      },
    });

    if (!isMember) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not authorized to delete tasks in this project',
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    // Log activity using PROJECT_UPDATED since there is no TASK_DELETED
    await tx.activityLog.create({
      data: {
        message: `Task "${task.title}" was deleted`,
        type: 'PROJECT_UPDATED',
        userId: userData.id,
        projectId: task.projectId,
        taskId: null,
      },
    });

    await tx.task.delete({
      where: { id },
    });
  });

  return { message: 'Task deleted successfully' };
};

export const taskService = {
  createTask,
  getAllTasks,
  getSingleTask,
  updateTask,
  deleteTask,
};
