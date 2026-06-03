"use server";

import { serverFetch } from "@/services/http";
import { IApiResponse, IPaginationResponse, IUser, IUserQueryParams } from "@/types";
import { revalidateTag } from "next/cache";

export const getAllUsers = async (
  params?: IUserQueryParams
): Promise<IApiResponse<IPaginationResponse<IUser>>> => {
  try {
    const query = new URLSearchParams();
    if (params?.searchTerm) query.append("searchTerm", params.searchTerm);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.role && params.role !== "ALL") query.append("role", params.role);

    const res = await serverFetch.get(`/user?${query.toString()}`, {
      next: { tags: ["users-list"] },
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
    console.error("Error in getAllUsers action:", error);
    return {
      success: false,
      message: "Failed to fetch users",
      data: { data: [], meta: { page: 1, limit: 10, total: 0 } },
    };
  }
};

export const changeUserStatus = async (
  userId: string,
  status: "ACTIVE" | "BLOCKED"
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.patch(`/user/${userId}/status`, {
      body: JSON.stringify({ status }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();
    if (result.success) {
      revalidateTag("users-list", { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in changeUserStatus action:", error);
    return { success: false, message: "Failed to update user status" };
  }
};

export const createUserAction = async (
  formData: FormData
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await serverFetch.post("/user/register", {
      body: formData,
    });

    const result = await res.json();
    if (result.success) {
      revalidateTag("users-list", { expire: 0 });
    }
    return result;
  } catch (error) {
    console.error("Error in createUserAction:", error);
    return { success: false, message: "Failed to create user" };
  }
};
