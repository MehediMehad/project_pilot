"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification/notification";

interface NotificationData {
  id?: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  priority?: string;
  actionUrl?: string;
  timestamp: string;
  isRead?: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationData[];
  unreadCount: number;
  clearNotification: (index: number) => void;
  clearAllNotifications: () => void;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  clearNotification: () => {},
  clearAllNotifications: () => {},
  markAllAsRead: async () => {},
  markAsRead: async () => {},
});

function getAccessTokenFromCookie(): string | null {
  if (typeof window === "undefined") return null;
  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("accessToken=")
  );
  if (!tokenCookie) return null;
  return tokenCookie.trim().split("=").slice(1).join("=");
}

interface SocketProviderProps {
  children: React.ReactNode;
  token?: string | null;
}

export function SocketProvider({ children, token: propToken }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const clearNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error(`Error marking notification ${id} read:`, err);
    }
  }, []);

  useEffect(() => {
    const token = propToken || getAccessTokenFromCookie();

    if (!token) {
      console.log("⚠️ No authentication token found for socket connection");
      return;
    }

    let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    if (typeof window !== "undefined") {
      const isDockerBackend = socketUrl.includes("backend");
      if (isDockerBackend) {
        socketUrl = socketUrl.replace("backend", window.location.hostname);
      }
    }

    console.log("Connecting socket to:", socketUrl);

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    // Load initial notifications from database
    const loadNotifications = async () => {
      try {
        const res = await getNotifications();
        if (res.success && res.data) {
          const formatted = res.data.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: n.createdAt,
            isRead: n.isRead,
          }));
          setNotifications(formatted);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    };

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setIsConnected(true);
      loadNotifications();
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    socketInstance.on("notification", (data: any) => {
      console.log("📬 New notification:", data);

      setNotifications((prev) => [
        {
          id: data.id,
          type: data.type,
          title: data.title,
          message: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);

      const toastType =
        data.priority === "HIGH"
          ? "warning"
          : data.priority === "LOW"
            ? "info"
            : "success";

      if (toastType === "warning") {
        toast.warning(data.title, {
          description: data.message,
          duration: 5000,
        });
      } else if (toastType === "info") {
        toast.info(data.title, {
          description: data.message,
          duration: 4000,
        });
      } else {
        toast.success(data.title, {
          description: data.message,
          duration: 4000,
        });
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [propToken]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        clearNotification,
        clearAllNotifications,
        markAllAsRead,
        markAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
