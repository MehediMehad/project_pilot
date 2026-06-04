import prisma from '../../../shared/prisma';
import { UserRole } from '@prisma/client';

const getDashboardStats = async (userId: string, role: UserRole) => {
  // 1. Scoped Project IDs for PM and Team Member
  let projectIds: string[] = [];
  if (role !== UserRole.ADMIN) {
    const memberProjects = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const managedProjects = await prisma.project.findMany({
      where: { createdById: userId },
      select: { id: true },
    });

    const ids = new Set([
      ...memberProjects.map((mp) => mp.projectId),
      ...managedProjects.map((p) => p.id),
    ]);
    projectIds = Array.from(ids);
  }

  // Base query filters
  const taskWhere: any = {};
  const projectWhere: any = {};

  if (role !== UserRole.ADMIN) {
    taskWhere.projectId = { in: projectIds };
    projectWhere.id = { in: projectIds };
  }

  // 2. Overview Stats
  let totalProjects = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  let totalMembers = 0;
  let overdueTasks = 0;

  const now = new Date();

  if (role === UserRole.ADMIN) {
    totalProjects = await prisma.project.count();
    totalTasks = await prisma.task.count();
    completedTasks = await prisma.task.count({ where: { status: 'COMPLETED' } });
    totalMembers = await prisma.user.count();
    overdueTasks = await prisma.task.count({
      where: {
        dueDate: { lt: now },
        status: { not: 'COMPLETED' },
      },
    });
  } else {
    totalProjects = projectIds.length;
    totalTasks = await prisma.task.count({ where: taskWhere });
    completedTasks = await prisma.task.count({
      where: { ...taskWhere, status: 'COMPLETED' },
    });
    overdueTasks = await prisma.task.count({
      where: {
        ...taskWhere,
        dueDate: { lt: now },
        status: { not: 'COMPLETED' },
      },
    });

    const membersCount = await prisma.projectMember.groupBy({
      by: ['userId'],
      where: { projectId: { in: projectIds } },
    });
    totalMembers = membersCount.length;
  }
  pendingTasks = totalTasks - completedTasks;
  const complianceRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3. Task Status Analytics
  const statusGroups = await prisma.task.groupBy({
    by: ['status'],
    where: taskWhere,
    _count: { id: true },
  });
  const statusAnalytics = {
    todo: statusGroups.find((g) => g.status === 'TODO')?._count.id || 0,
    inProgress: statusGroups.find((g) => g.status === 'IN_PROGRESS')?._count.id || 0,
    completed: statusGroups.find((g) => g.status === 'COMPLETED')?._count.id || 0,
  };

  // 4. Tasks by Priority
  const priorityGroups = await prisma.task.groupBy({
    by: ['priority'],
    where: taskWhere,
    _count: { id: true },
  });
  const priorityAnalytics = {
    low: priorityGroups.find((g) => g.priority === 'LOW')?._count.id || 0,
    medium: priorityGroups.find((g) => g.priority === 'MEDIUM')?._count.id || 0,
    high: priorityGroups.find((g) => g.priority === 'HIGH')?._count.id || 0,
  };

  // 5. Project Progress
  const projects = await prisma.project.findMany({
    where: projectWhere,
    include: {
      tasks: {
        select: { status: true },
      },
    },
    take: 10,
  });
  const projectProgress = projects.map((p) => {
    const total = p.tasks.length;
    const completed = p.tasks.filter((t) => t.status === 'COMPLETED').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      totalTasks: total,
      completedTasks: completed,
      progress,
    };
  });

  // 6. Member Workload Summary & Team Productivity
  let memberWorkload: any[] = [];
  if (role === UserRole.ADMIN) {
    const users = await prisma.user.findMany({
      where: { role: { in: [UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER] } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        assignedTasks: {
          select: { status: true },
        },
      },
      take: 15,
    });
    memberWorkload = users.map((u) => {
      const total = u.assignedTasks.length;
      const completed = u.assignedTasks.filter((t) => t.status === 'COMPLETED').length;
      const pending = total - completed;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
      };
    });
  } else {
    const members = await prisma.projectMember.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            assignedTasks: {
              where: taskWhere,
              select: { status: true },
            },
          },
        },
      },
    });

    const userMap = new Map<string, any>();
    members.forEach((m) => {
      if (!m.user) return;
      if (userMap.has(m.user.id)) return;
      const total = m.user.assignedTasks.length;
      const completed = m.user.assignedTasks.filter((t) => t.status === 'COMPLETED').length;
      const pending = total - completed;
      userMap.set(m.user.id, {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.user.role,
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
      });
    });
    memberWorkload = Array.from(userMap.values());
  }

  // 7. Upcoming Deadlines (within next 14 days, incomplete)
  const fourteenDaysFromNow = new Date();
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const upcomingDeadlines = await prisma.task.findMany({
    where: {
      ...taskWhere,
      status: { not: 'COMPLETED' },
      dueDate: {
        gte: new Date(),
        lte: fourteenDaysFromNow,
      },
    },
    orderBy: { dueDate: 'asc' },
    include: {
      project: { select: { name: true } },
      assignedTo: { select: { name: true, image: true } },
    },
    take: 5,
  });

  // 8. High Priority Tasks (incomplete)
  const highPriorityTasks = await prisma.task.findMany({
    where: {
      ...taskWhere,
      status: { not: 'COMPLETED' },
      priority: 'HIGH',
    },
    orderBy: { dueDate: 'asc' },
    include: {
      project: { select: { name: true } },
      assignedTo: { select: { name: true, image: true } },
    },
    take: 5,
  });

  return {
    overview: {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalMembers,
      complianceRate,
      overdueTasks,
    },
    statusAnalytics,
    priorityAnalytics,
    projectProgress,
    memberWorkload,
    upcomingDeadlines,
    highPriorityTasks,
  };
};

export const dashboardService = {
  getDashboardStats,
};
