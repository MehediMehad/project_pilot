"use server";

import { serverFetch } from "@/services/http";
import {
  IApiResponse,
  IPaginationResponse,
  IProject,
  IProjectDetail,
  IProjectMember,
  IProjectQueryParams,
  IProjectSummary,
} from "@/types";
import { revalidateTag } from "next/cache";

export const getAllProjects = async (
  params?: IProjectQueryParams
): Promise<IApiResponse<IPaginationResponse<IProject>>> => {
  try {
    const query = new URLSearchParams();
    if (params?.searchTerm) query.append("searchTerm", params.searchTerm);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.status && params.status !== "ALL")
      query.append("status", params.status);
    if (params?.sortBy) query.append("sortBy", params.sortBy);
    if (params?.sortOrder) query.append("sortOrder", params.sortOrder);

    const res = await serverFetch.get(`/project?${query.toString()}`, {
      next: { tags: ["projects-list"] },
      cache: "no-store",
    });

    const result = await res.json();
    return {
      success: result.success,
      message: result.message,
      data: {
        data: result.data,
        meta: result.meta,
      },
    };
  } catch (error) {
    console.error("Error in getAllProjects:", error);
    return {
      success: false,
      message: "Failed to fetch projects",
      data: { data: [], meta: { page: 1, limit: 10, total: 0 } },
    };
  }
};

export const getSingleProject = async (
  id: string
): Promise<IApiResponse<IProjectDetail>> => {
  try {
    const res = await serverFetch.get(`/project/${id}`, {
      next: { tags: [`project-${id}`] },
      cache: "no-store",
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error in getSingleProject:", error);
    return {
      success: false,
      message: "Failed to fetch project",
      data: null as unknown as IProjectDetail,
    };
  }
};

export const createProject = async (
  payload: { name: string; description?: string; deadline: string; status?: string }
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.post("/project", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.json();
    if (result.success) {
      revalidateTag("projects-list", { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in createProject:", error);
    return { success: false, message: "Failed to create project" };
  }
};

export const updateProject = async (
  id: string,
  payload: { name?: string; description?: string; deadline?: string; status?: string }
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.patch(`/project/${id}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.json();
    if (result.success) {
      revalidateTag("projects-list", { expire: 0 });
      revalidateTag(`project-${id}`, { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in updateProject:", error);
    return { success: false, message: "Failed to update project" };
  }
};

export const deleteProject = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.delete(`/project/${id}`);

    const result = await res.json();
    if (result.success) {
      revalidateTag("projects-list", { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in deleteProject:", error);
    return { success: false, message: "Failed to delete project" };
  }
};

export const addProjectMember = async (
  projectId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.post(`/project/${projectId}/members`, {
      body: JSON.stringify({ userId }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.json();
    if (result.success) {
      revalidateTag(`project-${projectId}`, { expire: 0 });
      revalidateTag("projects-list", { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in addProjectMember:", error);
    return { success: false, message: "Failed to add member" };
  }
};

export const removeProjectMember = async (
  projectId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.delete(
      `/project/${projectId}/members/${userId}`
    );

    const result = await res.json();
    if (result.success) {
      revalidateTag(`project-${projectId}`, { expire: 0 });
      revalidateTag("projects-list", { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in removeProjectMember:", error);
    return { success: false, message: "Failed to remove member" };
  }
};

export const getProjectMembers = async (
  projectId: string
): Promise<IApiResponse<IProjectMember[]>> => {
  try {
    const res = await serverFetch.get(`/project/${projectId}/members`, {
      next: { tags: [`project-${projectId}`] },
      cache: "no-store",
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error in getProjectMembers:", error);
    return {
      success: false,
      message: "Failed to fetch project members",
      data: [],
    };
  }
};

export const getProjectSummary = async (
  projectId: string
): Promise<IApiResponse<IProjectSummary>> => {
  try {
    const res = await serverFetch.get(`/project/${projectId}/summary`, {
      cache: "no-store",
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Error in getProjectSummary:", error);
    return {
      success: false,
      message: "Failed to fetch project summary",
      data: null as unknown as IProjectSummary,
    };
  }
};
