"use server";

import { serverFetch } from "@/services/http";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getDashboardStats() {
  try {
    const response = await serverFetch.get("/dashboard");
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("getDashboardStats error:", error);
    return {
      success: false,
      message: error?.message || "Something went wrong",
      data: null,
    };
  }
}
