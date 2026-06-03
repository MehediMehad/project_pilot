/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { serverFetch } from "@/services/http";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getCookie } from "./token-handlers.service";
import { IUser } from "@/types";

export const getUserInfo = async (): Promise<IUser | any> => {
    let userInfo: IUser | any;
    try {
        const response = await serverFetch.get("/auth/me", {
            next: { tags: ["user-info"], revalidate: 180 },
        })

        const result = await response.json();

        if (result.success) {
            const accessToken = await getCookie("accessToken");

            if (!accessToken) {
                throw new Error("No access token found");
            }

            const verifiedToken = jwt.verify(accessToken, process.env.JWT_SECRET as string) as JwtPayload;

            userInfo = {
                name: verifiedToken.name || "Unknown User",
                email: verifiedToken.email,
                role: verifiedToken.role,
            }
        }

        userInfo = {
            name: result.data.name || "Unknown User",
            ...result.data
        };

        return userInfo;
    } catch (error: any) {
        console.log(error);
        return {
            id: "",
            name: "Unknown User",
            email: "",
            role: "USER",
        };
    }
}