import { z } from "zod";

import { GlAccountCategory, GlAccountType } from "./types";

const typeValues = Object.values(GlAccountType) as [string, ...string[]];
const categoryValues = Object.values(GlAccountCategory) as [string, ...string[]];

export const createGlSchema = z.object({
  accountName: z
    .string()
    .trim()
    .min(3, "Give the account a recognisable name")
    .max(80, "Keep the name under 80 characters"),

  accountCode: z
    .string()
    .trim()
    .regex(/^\d{4,10}$/, "Use 4 to 10 digits, e.g. 100201"),

  accountType: z.enum(typeValues, { message: "Choose an account type" }),

  category: z.enum(categoryValues, { message: "Choose a category" }),

  currency: z
    .string()
    .trim()
    .length(3, "Use a 3-letter ISO code, e.g. NGN")
    .transform((value) => value.toUpperCase()),

  parentAccountCode: z
    .string()
    .trim()
    .regex(/^\d{4,10}$/, "Use 4 to 10 digits")
    .optional()
    .or(z.literal("")),

  description: z
    .string()
    .trim()
    .max(240, "Keep the description under 240 characters")
    .optional(),

  postingAllowed: z.boolean(),
});

export type CreateGlFormValues = z.input<typeof createGlSchema>;
export type CreateGlParsedValues = z.output<typeof createGlSchema>;
