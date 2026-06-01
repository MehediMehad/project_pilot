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
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  clearNotification: () => {},
  clearAllNotifications: () => {},
  markAllAsRead: async () => {},
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

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    socketInstance.on("notification", (data: NotificationData) => {
      console.log("📬 New notification:", data);

      setNotifications((prev) => [{ ...data, isRead: false }, ...prev]);

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
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
