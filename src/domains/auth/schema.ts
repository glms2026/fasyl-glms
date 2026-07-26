import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username or email is required"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),

  rememberDevice: z.boolean(),
});

export const forgotPasswordSchema = z.object({
  username: z.string().trim().min(1, "Username or email is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
