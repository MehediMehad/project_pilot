import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import config from '../config';
import { jwtHelpers } from '../helpers/jwtHelpers';
import { Secret } from 'jsonwebtoken';
import logger from '../lib/logger';
import prisma from '../shared/prisma';
import { UserRole } from '@prisma/client';

// Extend Socket.io Socket to include user info
declare module 'socket.io' {
  interface Socket {
    user?: {
      userId: string;
      email: string;
      role: UserRole;
    };
  }
}

export function initializeSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL || 'http://localhost:3000',
      ],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware — validate JWT on connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      // Remove "Bearer " prefix if present
      const cleanToken = token.replace('Bearer ', '');

      const decoded = jwtHelpers.verifyToken(cleanToken, config.jwt.jwt_secret as Secret);

      // Look up the user ID from the database using email
      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user info to socket
      socket.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    const user = socket.user!;
    logger.info(`✅ Socket connected: ${user.email} (${user.role})`);

    // Join user-specific room (by user ID)
    socket.join(`user:${user.userId}`);

    // Join role-specific room
    socket.join(`role:${user.role.toLowerCase()}`);

    // Join project room
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      logger.info(`Socket ${user.email} joined project room: project:${projectId}`);
    });

    // Leave project room
    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      logger.info(`Socket ${user.email} left project room: project:${projectId}`);
    });

    // Join task room
    socket.on('join:task', (taskId: string) => {
      socket.join(`task:${taskId}`);
      logger.info(`Socket ${user.email} joined task room: task:${taskId}`);
    });

    // Leave task room
    socket.on('leave:task', (taskId: string) => {
      socket.leave(`task:${taskId}`);
      logger.info(`Socket ${user.email} left task room: task:${taskId}`);
    });

    // Broadcast online status to admins
    io.to('role:admin').emit('user:online', {
      userId: user.userId,
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString(),
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`❌ Socket disconnected: ${user.email} (${reason})`);

      io.to('role:admin').emit('user:offline', {
        userId: user.userId,
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString(),
        reason,
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', error);
    });
  });

  return io;
}

export type SocketIOServer = ReturnType<typeof initializeSocket>;
