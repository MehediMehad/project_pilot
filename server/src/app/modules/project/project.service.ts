import { Prisma, Project, UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import { paginationHelper } from '../../../helpers/paginationHelper';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import { IAuthUser } from '../../interfaces/common';
import { IPaginationOptions } from '../../interfaces/pagination';
import { projectSearchAbleFields } from './project.constant';
import { notificationService } from '../notification/notification.service';

const createProject = async (user: IAuthUser, payload: any): Promise<Project> => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  // Find the user by email to get their id
  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const result = await prisma.$transaction(async (tx) => {
    // Create the project
    const project = await tx.project.create({
      data: {
        name: payload.name,
        description: payload.description,
        deadline: new Date(payload.deadline),
        status: payload.status || 'ACTIVE',
        createdById: userData.id,
      },
    });

    // Auto-add creator as a project member
    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId: userData.id,
      },
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        message: `Project "${project.name}" was created`,
        type: 'PROJECT_CREATED',
        userId: userData.id,
        projectId: project.id,
      },
    });

    return project;
  });

  return result;
};

const getAllProjects = async (params: any, options: IPaginationOptions, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.ProjectWhereInput[] = [];

  // Search
  if (searchTerm) {
    andConditions.push({
      OR: projectSearchAbleFields.map((field) => ({
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

  // Role-based visibility
  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  if (userData.role !== UserRole.ADMIN) {
    // PM and TM can only see projects they are members of
    andConditions.push({
      members: {
        some: {
          userId: userData.id,
        },
      },
    });
  }

  const whereConditions: Prisma.ProjectWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.project.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, image: true },
      },
      _count: {
        select: { tasks: true, members: true },
      },
    },
  });

  const total = await prisma.project.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getSingleProject = async (id: string, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const project = await prisma.project.findUniqueOrThrow({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true, role: true },
          },
        },
      },
      _count: {
        select: { tasks: true, members: true },
      },
    },
  });

  if (userData.role !== UserRole.ADMIN) {
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userData.id,
        },
      },
    });

    if (!isMember) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You are not authorized to view this project',
      );
    }
  }

  return project;
};

const updateProject = async (id: string, payload: any, user: IAuthUser): Promise<Project> => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const project = await prisma.project.findUniqueOrThrow({ where: { id } });

  // Only creator or ADMIN can update
  if (project.createdById !== userData.id && userData.role !== UserRole.ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this project');
  }

  const updateData: any = {};
  if (payload.name) updateData.name = payload.name;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.deadline) updateData.deadline = new Date(payload.deadline);
  if (payload.status) updateData.status = payload.status;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id },
      data: updateData,
    });

    await tx.activityLog.create({
      data: {
        message: `Project "${updated.name}" was updated`,
        type: 'PROJECT_UPDATED',
        userId: userData.id,
        projectId: updated.id,
      },
    });

    return updated;
  });

  return result;
};

const deleteProject = async (id: string, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const project = await prisma.project.findUniqueOrThrow({ where: { id } });

  // Only creator or ADMIN can delete
  if (project.createdById !== userData.id && userData.role !== UserRole.ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this project');
  }

  // Log activity before deleting (cascade will remove project)
  await prisma.activityLog.create({
    data: {
      message: `Project "${project.name}" was deleted`,
      type: 'PROJECT_DELETED',
      userId: userData.id,
      projectId: null, // project will be deleted
    },
  });

  await prisma.project.delete({ where: { id } });

  return { message: 'Project deleted successfully' };
};

const addProjectMember = async (projectId: string, userId: string, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  // Only creator or ADMIN can add members
  if (project.createdById !== userData.id && userData.role !== UserRole.ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to add members to this project');
  }

  // Check if user exists
  const targetUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true },
  });

  // Check for duplicate membership
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (existingMember) {
    throw new ApiError(httpStatus.CONFLICT, 'User is already a member of this project');
  }

  const result = await prisma.$transaction(async (tx) => {
    const member = await tx.projectMember.create({
      data: { projectId, userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        message: `${targetUser.name} was added to project "${project.name}"`,
        type: 'MEMBER_ADDED',
        userId: userData.id,
        projectId,
      },
    });

    return member;
  });

  // Send real-time notification to the added user
  await notificationService.sendNotification(
    'Added to Project',
    `You have been added to the project "${project.name}" by ${userData.name}`,
    'PROJECT_UPDATED',
    userId,
  );

  // Emit socket event to reload user's projects page
  if ((global as any).io) {
    (global as any).io.to(`user:${userId}`).emit('project:added', { projectId });
  }

  return result;
};

const removeProjectMember = async (projectId: string, userId: string, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  // Only creator or ADMIN can remove members
  if (project.createdById !== userData.id && userData.role !== UserRole.ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to remove members from this project');
  }

  // Cannot remove the project creator
  if (userId === project.createdById) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot remove the project creator from the project');
  }

  const targetUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    await tx.activityLog.create({
      data: {
        message: `${targetUser.name} was removed from project "${project.name}"`,
        type: 'MEMBER_REMOVED',
        userId: userData.id,
        projectId,
      },
    });
  });

  // Send real-time notification to the removed user
  await notificationService.sendNotification(
    'Removed from Project',
    `You have been removed from the project "${project.name}" by ${userData.name}`,
    'PROJECT_UPDATED',
    userId,
  );

  // Emit socket event to reload user's projects page
  if ((global as any).io) {
    (global as any).io.to(`user:${userId}`).emit('project:removed', { projectId });
  }

  return { message: 'Member removed successfully' };
};

const getProjectMembers = async (projectId: string) => {
  // Ensure project exists
  await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, role: true, status: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return members;
};

const getProjectSummary = async (projectId: string) => {
  // Ensure project exists
  await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  const [totalTasks, todoTasks, inProgressTasks, completedTasks] = await Promise.all([
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: 'TODO' } }),
    prisma.task.count({ where: { projectId, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { projectId, status: 'COMPLETED' } }),
  ]);

  // Member workload
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  // Aggregate workload stats using a single groupBy query instead of N+1 counts
  const taskGroups = await prisma.task.groupBy({
    by: ['assignedToId', 'status'],
    where: {
      projectId,
      assignedToId: { not: null },
    },
    _count: {
      _all: true,
    },
  });

  const workloadMap: Record<string, { total: number; completed: number; pending: number }> = {};
  for (const m of members) {
    workloadMap[m.userId] = { total: 0, completed: 0, pending: 0 };
  }

  for (const group of taskGroups) {
    const userId = group.assignedToId;
    if (!userId || !workloadMap[userId]) continue;

    const count = group._count._all;
    workloadMap[userId].total += count;
    if (group.status === 'COMPLETED') {
      workloadMap[userId].completed += count;
    } else {
      workloadMap[userId].pending += count;
    }
  }

  const memberWorkload = members.map((member) => {
    const stats = workloadMap[member.userId] || { total: 0, completed: 0, pending: 0 };
    return {
      user: member.user,
      totalTasks: stats.total,
      completedTasks: stats.completed,
      pendingTasks: stats.pending,
    };
  });

  return {
    taskStats: {
      total: totalTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
    },
    memberWorkload,
  };
};

export const projectService = {
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
