import { UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import { IAuthUser } from '../../interfaces/common';

const getAllActivities = async (
  user: IAuthUser,
  query: { page?: number; limit?: number }
) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;

  // Build filter based on role scoping
  let filter: any = {};

  if (userData.role !== UserRole.ADMIN) {
    // Find all projects where the user is a member
    const userProjectMemberships = await prisma.projectMember.findMany({
      where: {
        userId: userData.id,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = userProjectMemberships.map((pm) => pm.projectId);

    // Also include any project created by the user (if PM)
    if (userData.role === UserRole.PROJECT_MANAGER) {
      const createdProjects = await prisma.project.findMany({
        where: {
          createdById: userData.id,
        },
        select: {
          id: true,
        },
      });
      createdProjects.forEach((p) => {
        if (!projectIds.includes(p.id)) {
          projectIds.push(p.id);
        }
      });
    }

    // Filter to only these projects
    filter = {
      projectId: {
        in: projectIds,
      },
    };
  }

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.activityLog.count({
      where: filter,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};

export const activityService = {
  getAllActivities,
};
