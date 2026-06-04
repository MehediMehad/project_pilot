"use server"

import { redirect } from "next/navigation";
import { deleteCookie } from "./token-handlers.service";
import { serverFetch } from "@/services/http";

export const logoutUser = async () => {
    try {
        await serverFetch.post("/auth/logout");
    } catch (err) {
        console.error("Backend logout error:", err);
    }
    await deleteCookie("accessToken");
    await deleteCookie("refreshToken");

    redirect("/login?loggedOut=true");
}