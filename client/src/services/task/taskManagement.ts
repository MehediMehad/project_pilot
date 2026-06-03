"use server";

import { serverFetch } from "@/services/http";
import {
  IApiResponse,
  IPaginationResponse,
  ITask,
  ITaskQueryParams,
} from "@/types";
import { revalidateTag } from "next/cache";

const formatQueryParams = (params?: ITaskQueryParams): string => {
  const query = new URLSearchParams();
  if (params?.searchTerm) query.append("searchTerm", params.searchTerm);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.status && params.status !== "ALL") query.append("status", params.status);
  if (params?.priority && params.priority !== "ALL") query.append("priority", params.priority);
  if (params?.projectId) query.append("projectId", params.projectId);
  if (params?.assignedToId) query.append("assignedToId", params.assignedToId);
  if (params?.overdue) query.append("overdue", params.overdue);
  if (params?.upcoming) query.append("upcoming", params.upcoming);
  if (params?.sortBy) query.append("sortBy", params.sortBy);
  if (params?.sortOrder) query.append("sortOrder", params.sortOrder);
  return query.toString();
};

export const getAllTasks = async (
  params?: ITaskQueryParams
): Promise<IApiResponse<IPaginationResponse<ITask>>> => {
  try {
    const queryStr = formatQueryParams(params);
    const res = await serverFetch.get(`/task?${queryStr}`, {
      next: { tags: ["tasks-list"] },
      cache: "no-store",
    });

    const result = await res.json();
    return {
      success: result.success,
      message: result.message,
      data: {
        data: result.data || [],
        meta: result.meta || { page: 1, limit: 10, total: 0 },
      },
    };
  } catch (error) {
    console.error("Error in getAllTasks:", error);
    return {
      success: false,
      message: "Failed to fetch tasks",
      data: { data: [], meta: { page: 1, limit: 10, total: 0 } },
    };
  }
};

export const getMyTasks = async (
  params?: ITaskQueryParams
): Promise<IApiResponse<IPaginationResponse<ITask>>> => {
  try {
    const queryStr = formatQueryParams(params);
    const res = await serverFetch.get(`/task/my-tasks?${queryStr}`, {
      next: { tags: ["tasks-list", "my-tasks-list"] },
      cache: "no-store",
    });

    const result = await res.json();
    return {
      success: result.success,
      message: result.message,
      data: {
        data: result.data || [],
        meta: result.meta || { page: 1, limit: 10, total: 0 },
      },
    };
  } catch (error) {
    console.error("Error in getMyTasks:", error);
    return {
      success: false,
      message: "Failed to fetch my tasks",
      data: { data: [], meta: { page: 1, limit: 10, total: 0 } },
    };
  }
};

export const getOverdueTasks = async (
  params?: ITaskQueryParams
): Promise<IApiResponse<IPaginationResponse<ITask>>> => {
  try {
    const queryStr = formatQueryParams(params);
    const res = await serverFetch.get(`/task/overdue?${queryStr}`, {
      next: { tags: ["tasks-list", "overdue-tasks-list"] },
      cache: "no-store",
    });

    const result = await res.json();
    return {
      success: result.success,
      message: result.message,
      data: {
        data: result.data || [],
        meta: result.meta || { page: 1, limit: 10, total: 0 },
      },
    };
  } catch (error) {
    console.error("Error in getOverdueTasks:", error);
    return {
      success: false,
      message: "Failed to fetch overdue tasks",
      data: { data: [], meta: { page: 1, limit: 10, total: 0 } },
    };
  }
};

export const getUpcomingTasks = async (
  params?: ITaskQueryParams
): Promise<IApiResponse<IPaginationResponse<ITask>>> => {
  try {
    const queryStr = formatQueryParams(params);
    const res = await serverFetch.get(`/task/upcoming?${queryStr}`, {
      next: { tags: ["tasks-list", "upcoming-tasks-list"] },
      cache: "no-store",
    });

    const result = await res.json();
    return {
      success: result.success,
      message: result.message,
      data: {
        data: result.data || [],
        meta: result.meta || { page: 1, limit: 10, total: 0 },
      },
    };
  } catch (error) {
    console.error("Error in getUpcomingTasks:", error);
    return {
      success: false,
      message: "Failed to fetch upcoming tasks",
      data: { data: [], meta: { page: 1, limit: 10, total: 0 } },
    };
  }
};

export const getSingleTask = async (
  id: string
): Promise<IApiResponse<ITask>> => {
  try {
    const res = await serverFetch.get(`/task/${id}`, {
      next: { tags: [`task-${id}`] },
      cache: "no-store",
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error in getSingleTask:", error);
    return {
      success: false,
      message: "Failed to fetch task",
      data: null as unknown as ITask,
    };
  }
};

export const createTask = async (
  payload: {
    title: string;
    description?: string;
    dueDate: string;
    priority?: string;
    status?: string;
    projectId: string;
    assignedToId?: string | null;
  }
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.post("/task", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.json();
    if (result.success) {
      revalidateTag("tasks-list", { expire: 0 });
      revalidateTag("my-tasks-list", { expire: 0 });
      revalidateTag("overdue-tasks-list", { expire: 0 });
      revalidateTag("upcoming-tasks-list", { expire: 0 });
      revalidateTag(`project-${payload.projectId}`, { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in createTask:", error);
    return { success: false, message: "Failed to create task" };
  }
};

export const updateTask = async (
  id: string,
  projectId: string,
  payload: {
    title?: string;
    description?: string | null;
    dueDate?: string;
    priority?: string;
    status?: string;
    assignedToId?: string | null;
  }
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.patch(`/task/${id}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.json();
    if (result.success) {
      revalidateTag("tasks-list", { expire: 0 });
      revalidateTag("my-tasks-list", { expire: 0 });
      revalidateTag("overdue-tasks-list", { expire: 0 });
      revalidateTag("upcoming-tasks-list", { expire: 0 });
      revalidateTag(`task-${id}`, { expire: 0 });
      revalidateTag(`project-${projectId}`, { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in updateTask:", error);
    return { success: false, message: "Failed to update task" };
  }
};

export const deleteTask = async (
  id: string,
  projectId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.delete(`/task/${id}`);

    const result = await res.json();
    if (result.success) {
      revalidateTag("tasks-list", { expire: 0 });
      revalidateTag("my-tasks-list", { expire: 0 });
      revalidateTag("overdue-tasks-list", { expire: 0 });
      revalidateTag("upcoming-tasks-list", { expire: 0 });
      revalidateTag(`project-${projectId}`, { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in deleteTask:", error);
    return { success: false, message: "Failed to delete task" };
  }
};
