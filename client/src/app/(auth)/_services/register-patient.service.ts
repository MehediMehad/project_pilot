/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { serverFetch } from "@/services/http";
import { zodValidator } from "@/lib/utils/zod-validator";
import { registerPatientValidationZodSchema } from "@/app/(auth)/_validations/auth.validation";
import { loginUser } from "./login-user.service";

export const registerPatient = async (_currentState: any, formData: any): Promise<any> => {
    try {
        const payload = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
        }

        if (zodValidator(payload, registerPatientValidationZodSchema).success === false) {
            return zodValidator(payload, registerPatientValidationZodSchema);
        }

        const validatedPayload: any = zodValidator(payload, registerPatientValidationZodSchema).data;
        const registerData = {
            name: validatedPayload.name,
            email: validatedPayload.email,
            role: validatedPayload.role,
            password: validatedPayload.password,
        }

        const newFormData = new FormData();
        newFormData.append("data", JSON.stringify(registerData));

        if (formData.get("file")) {
            newFormData.append("file", formData.get("file") as Blob);
        }

        const res = await serverFetch.post("/user/register", {
            body: newFormData,
        })

        const result = await res.json();

        if (result.success) {
            await loginUser(_currentState, formData);
        }

        return result;
    } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.log(error);
        return { success: false, message: `${process.env.NODE_ENV === 'development' ? error.message : "Registration Failed. Please try again."}` };
    }
}
