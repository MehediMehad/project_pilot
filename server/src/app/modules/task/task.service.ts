import { Prisma, Task, UserRole } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import httpStatus from 'http-status';
import config from '../../../config';
import { fileUploader } from '../../../helpers/fileUploader';
import { paginationHelper } from '../../../helpers/paginationHelper';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';
import { IAuthUser } from '../../interfaces/common';
import { IPaginationOptions } from '../../interfaces/pagination';
import { taskSearchAbleFields } from './task.constant';
import { notificationService } from '../notification/notification.service';

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

  // Check for duplicate task title in project
  const existingTask = await prisma.task.findUnique({
    where: {
      projectId_title: {
        projectId: payload.projectId,
        title: payload.title,
      },
    },
  });

  if (existingTask) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'This task already exists in the project.',
    );
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

  // Notify assignee on task creation
  if (result.assignedToId) {
    await notificationService.sendNotification(
      'New Task Assigned',
      `You have been assigned to task "${result.title}"`,
      'TASK_ASSIGNED',
      result.assignedToId,
    );
  }

  // Socket.io Real-time broadcast
  if ((global as any).io) {
    const fullTask = await prisma.task.findUnique({
      where: { id: result.id },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    if (fullTask) {
      (global as any).io.to(`project:${result.projectId}`).emit('task:created', fullTask);
      (global as any).io.emit('stats:updated', { projectId: result.projectId });
    }
  }

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

  // TEAM_MEMBER can only update tasks assigned to them
  if (userData.role === UserRole.TEAM_MEMBER && task.assignedToId !== userData.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You are not authorized to update this task as it is not assigned to you',
    );
  }

  // Completed tasks cannot be reassigned
  if (
    payload.assignedToId !== undefined &&
    payload.assignedToId !== task.assignedToId &&
    task.status === 'COMPLETED'
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Completed tasks cannot be reassigned.',
    );
  }

  // Check for duplicate task title in project if title is being changed
  if (payload.title && payload.title !== task.title) {
    const existingTask = await prisma.task.findUnique({
      where: {
        projectId_title: {
          projectId: task.projectId,
          title: payload.title,
        },
      },
    });

    if (existingTask) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This task already exists in the project.',
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

  // Trigger notifications on update
  if (
    payload.assignedToId !== undefined &&
    payload.assignedToId !== task.assignedToId &&
    result.assignedToId
  ) {
    await notificationService.sendNotification(
      'New Task Assigned',
      `You have been assigned to task "${result.title}"`,
      'TASK_ASSIGNED',
      result.assignedToId,
    );
  } else if (
    result.assignedToId &&
    result.assignedToId !== userData.id &&
    (payload.status || payload.priority || payload.title || payload.description)
  ) {
    let updateMessage = `Task "${result.title}" details were updated`;
    if (payload.status && payload.status !== task.status) {
      updateMessage = `Task "${result.title}" status was changed to ${result.status}`;
    } else if (payload.priority && payload.priority !== task.priority) {
      updateMessage = `Task "${result.title}" priority was changed to ${result.priority}`;
    }

    await notificationService.sendNotification(
      'Task Updated',
      updateMessage,
      'TASK_UPDATED',
      result.assignedToId,
    );
  }

  // Socket.io Real-time broadcast
  if ((global as any).io) {
    const fullTask = await prisma.task.findUnique({
      where: { id: result.id },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    if (fullTask) {
      (global as any).io.to(`project:${result.projectId}`).emit('task:updated', fullTask);
      (global as any).io.to(`task:${result.id}`).emit('task:details_updated', fullTask);
      (global as any).io.emit('stats:updated', { projectId: result.projectId });
    }
  }

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
    // Log activity using TASK_DELETED
    await tx.activityLog.create({
      data: {
        message: `Task "${task.title}" was deleted`,
        type: 'TASK_DELETED',
        userId: userData.id,
        projectId: task.projectId,
        taskId: null,
      },
    });

    await tx.task.delete({
      where: { id },
    });
  });

  if ((global as any).io) {
    (global as any).io.to(`project:${task.projectId}`).emit('task:deleted', { id });
    (global as any).io.emit('stats:updated', { projectId: task.projectId });
  }

  return { message: 'Task deleted successfully' };
};

const checkTaskAccess = async (taskId: string, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
  });

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
        'You are not authorized to access this task',
      );
    }
  }

  return { task, userData };
};

const createComment = async (taskId: string, payload: { content: string }, user: IAuthUser) => {
  const { task, userData } = await checkTaskAccess(taskId, user);

  const result = await prisma.comment.create({
    data: {
      content: payload.content,
      taskId,
      userId: userData.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  });

  // Log Activity
  await prisma.activityLog.create({
    data: {
      message: `New comment added by ${userData.name} on task "${task.title}"`,
      type: 'COMMENT_CREATED',
      userId: userData.id,
      projectId: task.projectId,
      taskId: taskId,
    },
  });

  // Notify task assignee if someone else comments
  if (task.assignedToId && task.assignedToId !== userData.id) {
    await notificationService.sendNotification(
      'New Comment Added',
      `${userData.name} commented on task "${task.title}"`,
      'COMMENT_ADDED',
      task.assignedToId,
    );
  }

  // Socket.io Real-time comments & activities broadcast
  if ((global as any).io) {
    (global as any).io.to(`task:${taskId}`).emit('comment:created', result);
    const activity = await prisma.activityLog.findFirst({
      where: { taskId, type: 'COMMENT_CREATED' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
      },
    });
    if (activity) {
      (global as any).io.to(`task:${taskId}`).emit('activity:created', activity);
    }
  }

  return result;
};

const getTaskComments = async (taskId: string, user: IAuthUser) => {
  await checkTaskAccess(taskId, user);

  const result = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  });

  return result;
};

const updateComment = async (commentId: string, payload: { content: string }, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  if (userData.role !== UserRole.ADMIN && comment.userId !== userData.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You are not authorized to update this comment',
    );
  }

  const result = await prisma.comment.update({
    where: { id: commentId },
    data: { content: payload.content },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  });

  if ((global as any).io) {
    (global as any).io.to(`task:${comment.taskId}`).emit('comment:updated', result);
  }

  return result;
};

const deleteComment = async (commentId: string, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  if (userData.role !== UserRole.ADMIN && comment.userId !== userData.id) {
    const task = await prisma.task.findUnique({
      where: { id: comment.taskId },
    });
    if (task) {
      const isProjectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId: userData.id,
          },
        },
      });
      if (!isProjectMember || userData.role !== UserRole.PROJECT_MANAGER) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'You are not authorized to delete this comment',
        );
      }
    }
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  if ((global as any).io) {
    (global as any).io.to(`task:${comment.taskId}`).emit('comment:deleted', { id: commentId });
  }

  return { message: 'Comment deleted successfully' };
};

const createAttachment = async (taskId: string, req: any, user: IAuthUser) => {
  const file = req.file;
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'File is required');
  }

  const { task, userData } = await checkTaskAccess(taskId, user);

  const uploadResult = await fileUploader.uploadToCloudinary(file);

  const result = await prisma.attachment.create({
    data: {
      fileName: file.originalname,
      fileUrl: uploadResult.secure_url,
      fileType: file.mimetype,
      publicId: uploadResult.public_id,
      taskId,
    },
  });

  // Log Activity
  await prisma.activityLog.create({
    data: {
      message: `Attachment "${file.originalname}" was uploaded`,
      type: 'ATTACHMENT_UPLOADED',
      userId: userData.id,
      projectId: task.projectId,
      taskId: taskId,
    },
  });

  // Socket.io Real-time attachments & activities broadcast
  if ((global as any).io) {
    (global as any).io.to(`task:${taskId}`).emit('attachment:created', result);
    const activity = await prisma.activityLog.findFirst({
      where: { taskId, type: 'ATTACHMENT_UPLOADED' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
      },
    });
    if (activity) {
      (global as any).io.to(`task:${taskId}`).emit('activity:created', activity);
    }
  }

  return result;
};

const getTaskAttachments = async (taskId: string, user: IAuthUser) => {
  await checkTaskAccess(taskId, user);

  const result = await prisma.attachment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
  });

  return result;
};

const deleteAttachment = async (attachmentId: string, user: IAuthUser) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
  });

  const attachment = await prisma.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
  });

  const task = await prisma.task.findUniqueOrThrow({
    where: { id: attachment.taskId },
  });

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
        'You are not authorized to delete attachments in this project',
      );
    }
  }

  if (attachment.publicId) {
    try {
      cloudinary.config({
        cloud_name: config.cloudinary.cloud_name,
        api_key: config.cloudinary.api_key,
        api_secret: config.cloudinary.api_secret,
      });
      await cloudinary.uploader.destroy(attachment.publicId);
    } catch (e) {
      console.error('Failed to delete attachment from Cloudinary:', e);
    }
  }

  await prisma.attachment.delete({
    where: { id: attachmentId },
  });

  if ((global as any).io) {
    (global as any).io.to(`task:${attachment.taskId}`).emit('attachment:deleted', { id: attachmentId });
  }

  return { message: 'Attachment deleted successfully' };
};

const getTaskActivityLogs = async (taskId: string, user: IAuthUser) => {
  await checkTaskAccess(taskId, user);
  return await prisma.activityLog.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  });
};

export const taskService = {
  createTask,
  getAllTasks,
  getSingleTask,
  updateTask,
  deleteTask,
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
  createAttachment,
  getTaskAttachments,
  deleteAttachment,
  getTaskActivityLogs,
};
