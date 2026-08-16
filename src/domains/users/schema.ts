import { z } from "zod";

const name = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(2, `Enter the user's ${label}`)
    .max(max, `Keep the ${label} under ${max} characters`);

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

const reason = z
  .string()
  .trim()
  .min(5, "Explain the reason (at least 5 characters)")
  .max(1000, "Keep the reason under 1,000 characters");

const roles = z
  .array(z.string().trim().min(1, "Role names can't be empty"))
  .min(1, "Assign at least one role")
  .max(10, "Too many roles");

const permissions = z
  .array(z.string())
  .min(1, "Grant at least one permission");

export const createUserSchema = z.object({
  firstName: name("first name", 100),
  lastName: name("last name", 100),
  username,
  email,
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/\d/, "Add a number")
    .regex(/[^A-Za-z0-9]/, "Add a special character"),
  roles,
  permissions,
  reason,
});

const editableStatuses = [
  "ACTIVE",
  "INACTIVE",
  "LOCKED",
  "SUSPENDED",
  "PASSWORD_EXPIRED",
] as const;

export const editUserSchema = z.object({
  firstName: name("first name", 100),
  lastName: name("last name", 100),
  username,
  email,
  status: z.enum(editableStatuses, { message: "Choose a status" }),
});

export const assignRolesSchema = z.object({
  roles,
  reason,
});

export const actionReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Add a short reason (at least 3 characters)")
    .max(1000, "Keep the reason under 1,000 characters"),
});

export const approvalDecisionSchema = z.object({
  remark: z
    .string()
    .trim()
    .max(1000, "Keep the remark under 1,000 characters")
    .optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type EditUserFormValues = z.infer<typeof editUserSchema>;
export type AssignRolesFormValues = z.infer<typeof assignRolesSchema>;
export type ActionReasonFormValues = z.infer<typeof actionReasonSchema>;
export type ApprovalDecisionFormValues = z.infer<typeof approvalDecisionSchema>;
