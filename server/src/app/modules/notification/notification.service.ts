import { Notification, NotificationType } from '@prisma/client';
import prisma from '../../../shared/prisma';
import logger from '../../../lib/logger';

const getUserNotifications = async (email: string): Promise<Notification[]> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });
  return await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
};

const markAllNotificationsAsRead = async (email: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });
  return await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
};

const markNotificationAsRead = async (email: string, notificationId: string): Promise<Notification> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });
  return await prisma.notification.update({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });
};

const deleteNotification = async (email: string, notificationId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });
  return await prisma.notification.delete({
    where: { id: notificationId, userId: user.id },
  });
};

const sendNotification = async (
  title: string,
  message: string,
  type: NotificationType,
  userId: string,
): Promise<Notification | null> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId,
      },
    });

    // Emit live socket event if Socket.io server is available globally
    if ((global as any).io) {
      const socketData = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        timestamp: notification.createdAt.toISOString(),
      };
      (global as any).io.to(`user:${userId}`).emit('notification', socketData);
      logger.info(`📬 Live socket notification sent to user:${userId}`);
    }

    return notification;
  } catch (error) {
    logger.error('Failed to create/send notification', error as Error);
    return null;
  }
};

export const notificationService = {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  sendNotification,
};
