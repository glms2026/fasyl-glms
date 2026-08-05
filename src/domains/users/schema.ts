import { z } from "zod";

import { UserRole, UserStatus } from "./types";

const roleValues = Object.values(UserRole) as [string, ...string[]];
const statusValues = Object.values(UserStatus) as [string, ...string[]];

const fullName = z
  .string()
  .trim()
  .min(2, "Enter the user's full name")
  .max(80, "Keep the name under 80 characters");

const username = z
  .string()
  .trim()
  .min(3, "Usernames need at least 3 characters")
  .max(30, "Keep the username under 30 characters")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Use letters, numbers, dots, underscores or hyphens only",
  );

const email = z
  .string()
  .trim()
  .min(1, "Enter an email address")
  .email("Enter a valid email address");

export const createUserSchema = z.object({
  fullName,
  username,
  email,
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/\d/, "Add a number")
    .regex(/[^A-Za-z0-9]/, "Add a special character"),
  role: z.enum(roleValues, { message: "Choose a role" }),
  permissions: z.array(z.string()).min(1, "Grant at least one permission"),
});

export const editUserSchema = z.object({
  fullName,
  username,
  email,
  role: z.enum(roleValues, { message: "Choose a role" }),
  status: z.enum(statusValues, { message: "Choose a status" }),
  permissions: z.array(z.string()).min(1, "Grant at least one permission"),
});

export const lockUserSchema = z.object({
  duration: z
    .number({ message: "Enter how long to lock the account" })
    .int("Use a whole number")
    .min(1, "Lock for at least 1 minute")
    .max(10080, "Locks can't exceed 7 days (10,080 minutes)"),
  unit: z.enum(["minutes", "hours", "days"]),
});

export const suspendUserSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(240, "Keep the reason under 240 characters")
    .optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type EditUserFormValues = z.infer<typeof editUserSchema>;
export type LockUserFormValues = z.infer<typeof lockUserSchema>;
export type SuspendUserFormValues = z.infer<typeof suspendUserSchema>;

/** Converts the lock dialog's duration + unit into minutes for the API. */
export function toMinutes({ duration, unit }: LockUserFormValues): number {
  if (unit === "hours") return duration * 60;
  if (unit === "days") return duration * 60 * 24;

  return duration;
}
