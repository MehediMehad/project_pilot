"use server";

import { serverFetch } from "@/services/http";
import { IApiResponse, IPaginationResponse } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getWorkspaceActivities(
  page: number = 1,
  limit: number = 10
): Promise<IApiResponse<IPaginationResponse<any>>> {
  try {
    const res = await serverFetch.get(`/activity?page=${page}&limit=${limit}`, {
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
  } catch (error: any) {
    console.error("getWorkspaceActivities error:", error);
    return {
      success: false,
      message: error?.message || "Failed to fetch activities",
      data: {
        data: [],
        meta: { page: 1, limit: 10, total: 0 },
      },
    };
  }
}
