"use server";

import { serverFetch } from "@/services/http";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getNotifications() {
  try {
    const response = await serverFetch.get("/notification");
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("getNotifications error:", error);
    return {
      success: false,
      message: error?.message || "Something went wrong",
      data: [],
    };
  }
}

export async function markAllNotificationsRead() {
  try {
    const response = await serverFetch.patch("/notification/read-all");
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("markAllNotificationsRead error:", error);
    return {
      success: false,
      message: error?.message || "Something went wrong",
    };
  }
}

export async function markNotificationRead(id: string) {
  try {
    const response = await serverFetch.patch(`/notification/${id}/read`);
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("markNotificationRead error:", error);
    return {
      success: false,
      message: error?.message || "Something went wrong",
    };
  }
}
